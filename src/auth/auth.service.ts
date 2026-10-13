import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import ms from 'ms';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { hash,compare } from './utils/hashing';
import { generateOpaqueToken, hashToken } from './utils/token';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  // ============================================================
  // SIGNUP
  // ============================================================

  async signup(dto: CreateAuthDto, ip?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await hash(
      dto.password
    );

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
      },
    });

    //Email Verification Code
    // await this.sendVerificationEmail(
    //  user.id,
    //  user.email,
    // );
    
    const tokens = await this.generateTokens(
      user.id,
      user.email,
    );

    await this.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      ip,
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ============================================================
  // SIGNIN
  // ============================================================

  async signin(dto: CreateAuthDto, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
    );

    await this.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      ip,
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ============================================================
  // Refresh (rotation + reuse detection)
  // ============================================================

async refreshTokens(refreshToken: string, ip?: string) {
  // 1. Verify JWT signature + expiry.
  // This happens before the database lookup.
  let payload: { sub: string };

  try {
    payload = await this.jwt.verifyAsync<{ sub: string }>(
      refreshToken,
      {
        secret: this.config.getOrThrow<string>(
          'JWT_REFRESH_SECRET',
        ),
      },
    );
  } catch {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // Make sure the JWT contains a user ID.
  if (!payload.sub) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // 2. Hash the presented refresh token.
  //
  const tokenHash = hashToken(refreshToken);

  // 3. Find the exact refresh-token record.
  const stored = await this.prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
  });

  if (!stored) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // 4. Reuse detection.
  //
  // If this token was already rotated/revoked and someone
  // presents it again, treat it as token reuse.
  if (stored.revokedAt) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: stored.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    throw new UnauthorizedException(
      'Refresh token reuse detected — all sessions revoked',
    );
  }

  // 5. Check database expiration.
  if (stored.expiresAt < new Date()) {
    throw new UnauthorizedException(
      'Refresh token expired',
    );
  }

  // 6. Find the user.
  const user = await this.prisma.user.findUnique({
    where: {
      id: stored.userId,
    },
  });

  if (!user) {
    throw new UnauthorizedException(
      'User no longer exists',
    );
  }

  // Optional but recommended:
  // Make sure the JWT subject belongs to the same user
  // whose token record we found.
  if (payload.sub !== stored.userId) {
    throw new UnauthorizedException(
      'Invalid refresh token',
    );
  }

  // 7. Generate a completely new access + refresh token pair.
  const tokens = await this.generateTokens(
    user.id,
    user.email,
  );

  // 8. Hash the NEW refresh token before storing it.
  const newTokenHash =  hashToken(
    tokens.refreshToken,
  );

  // 9. Calculate the new refresh-token expiration
  // using the same configuration as storeRefreshToken().
  const ttl = this.config.getOrThrow<string>(
    'REFRESH_TOKEN_TTL',
  ) as StringValue;

  const expiresAt = new Date(
    Date.now() + ms(ttl),
  );

  // 10. Rotate atomically.
  //
  // Old token:
  //   revokedAt = now
  //   replacedByTokenHash = new token hash
  //
  // New token:
  //   inserted as a fresh active session token
  await this.prisma.$transaction([
    this.prisma.refreshToken.update({
      where: {
        id: stored.id,
      },
      data: {
        revokedAt: new Date(),
        replacedByTokenHash: newTokenHash,
      },
    }),

    this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt,
        createdByIp: ip,
      },
    }),
  ]);

  // 11. Controller will put these into cookies.
  return tokens;
}


  // ============================================================
  // SIGNOUT
  // ============================================================

  async signout(refreshToken: string) {
    const tokenHash =  hashToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Signed out successfully',
    };
  }

  // ============================================================
  // Email verification
  // ============================================================

  async sendVerificationEmail(
  userId: string,
  email: string,
) {
  // 1. Generate a random opaque token.
  const rawToken = generateOpaqueToken();

  // 2. Store only the hash in the database.
  const tokenHash = hashToken(rawToken);

  // 3. Read verification-token lifetime from config.
  const ttl = this.config.getOrThrow<string>(
    'EMAIL_VERIFICATION_TTL',
  ) as StringValue;

  // 4. Calculate expiration time.
  const expiresAt = new Date(
    Date.now() + ms(ttl),
  );

  // 5. Store hashed token in database.
  await this.prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  // 6. The RAW token goes into the email.
  // The hash NEVER goes into the email.
  const appUrl = this.config.getOrThrow<string>(
    'APP_URL',
  );

  const verifyUrl =
    `${appUrl}/auth/verify-email?token=${rawToken}`;

  // 7. Send email.
  await this.mail.send({
    to: email,
    subject: 'Verify your email',
    html: `
      <p>Please verify your email address.</p>
      <p>
        <a href="${verifyUrl}">
          Verify your email
        </a>
      </p>
      <p>This verification link will expire soon.</p>
    `,
  });
}


async verifyEmail(rawToken: string) {

  // 1. Hash the token received from the URL.
  const tokenHash =  hashToken(rawToken);

  // 2. Find the matching verification-token record.
  const record =
    await this.prisma.emailVerificationToken.findUnique({
      where: {
        tokenHash,
      },
    });

  // 3. Validate token.
  if (
    !record ||
    record.usedAt ||
    record.expiresAt < new Date()
  ) {
    throw new UnauthorizedException(
      'Invalid or expired verification link',
    );
  }

  // 4. Mark token as used and user as verified
  //    atomically.
  await this.prisma.$transaction([
    this.prisma.emailVerificationToken.update({
      where: {
        id: record.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),

    this.prisma.user.update({
      where: {
        id: record.userId,
      },
      data: {
        isEmailVerified: true,
      },
    }),
  ]);

  return {
    message: 'Email verified successfully',
  };
}

  // ============================================================
  // Resend verification mail
  // ============================================================

  async resendVerificationEmail(email: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      email,
    },
  });

  // Do not reveal whether the email exists.
  if (user && !user.isEmailVerified) {
    await this.sendVerificationEmail(
      user.id,
      user.email,
    );
  }

  return {
    message:
      'If that email exists, a verification link has been sent',
  };
}

// Change Password
  async changePassword(
    userId:string,
    currentPassword:string,
    newPassword:string
  ){
     //check user exists
     const user = await this.prisma.user.findUnique({
      where:{
        id:userId,
      }
     });
     if (!user) {
      throw new UnauthorizedException('User not found');
     }

     // check current password is valid
     const passwordValid = await compare(
      currentPassword,
      user.passwordHash
     );

     if(!passwordValid){
      throw new UnauthorizedException('Current password is incorrect');
     }

     // prevent using same password
     const samePassword = await compare(
      newPassword,
      user.passwordHash
     );

     if (samePassword) {
      throw new ConflictException('New password must be different from current password');
     }

     const passwordHash = await hash(newPassword);

     const updatedUser = await this.prisma.user.update({
      where:{
        id:userId
      },
      data:{
        passwordHash,
      }
     });

     return {
      message: "Password changed successfully"
     };

  }

// /me route for authorization
  async getMe(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}

///////////////////////////////////// UTILITY FUNCTIONS ///////////////////////////////////////

  // ============================================================
  // GENERATE TOKENS
  // ============================================================

  private async generateTokens(
    userId: string,
    email: string,
  ) {
    const accessToken = await this.jwt.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.config.getOrThrow<string>(
          'JWT_ACCESS_SECRET',
        ),
        expiresIn: this.config.getOrThrow<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ) as StringValue,
      },
    );

    const refreshToken = await this.jwt.signAsync(
      {
        sub: userId,
      },
      {
        secret: this.config.getOrThrow<string>(
          'JWT_REFRESH_SECRET',
        ),
        expiresIn: this.config.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as StringValue,
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  // ============================================================
  // STORE REFRESH TOKEN
  // ============================================================

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    ip?: string,
  ) {
    const tokenHash =  hashToken(refreshToken);

    const ttl =  this.config.getOrThrow<string>(
      'REFRESH_TOKEN_TTL',
    ) as StringValue;

    const expiresAt = new Date(
      Date.now() + ms(ttl),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        createdByIp: ip,
      },
    });
  }

  

  // ============================================================
  // REMOVE SENSITIVE USER DATA
  // ============================================================
  private sanitizeUser(user: {
    id: string;
    email: string;
  }) {
    return {
      id: user.id,
      email: user.email,
    };
  }

  



}
