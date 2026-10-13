// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { ChangePasswordDto, CreateAuthDto } from './dto/create-auth.dto';
import { AuthGuard } from './auth.guard';
import type {JwtPayload} from './interfaces/jwt_payload.interface'
import { CurrentUser } from './decorators/current-user.decorator';

const isProd = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd, // cookies only over HTTPS in prod; allow http on localhost
  sameSite: 'strict' as const, // CSRF mitigation — flip to 'lax' if you need cross-site redirects (e.g. OAuth)
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body() dto: CreateAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.signup(dto, req.ip);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('signin')
  async signin(
    @Body() dto: CreateAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.signin(dto, req.ip);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokens = await this.authService.refreshTokens(refreshToken, req.ip);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { message: 'Token refreshed' };
  }

  @Post('signout')
  async signout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (refreshToken) {
      await this.authService.signout(refreshToken);
    }
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/auth/refresh' });
    return { message: 'Signed out successfully' };
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  async changePassword(
  @Body() dto: ChangePasswordDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.authService.changePassword(
    user.sub,
    dto.currentPassword!,
    dto.password,
  );
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getMe(
    @CurrentUser()  user : JwtPayload
  ){
    return this.authService.getMe(user.sub);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) throw new UnauthorizedException('Missing verification token');
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(ACCESS_COOKIE, accessToken, {
      ...baseCookieOptions,
      maxAge: 15 * 60 * 1000, // 15 min — keep in sync with JWT_ACCESS_EXPIRES_IN
      path: '/',
    });

    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...baseCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, 
      // Scoped to /auth/refresh only — the browser won't even attach this
      // cookie to unrelated API calls, shrinking its exposure surface.
      path: '/auth/refresh',
    });
  }
}