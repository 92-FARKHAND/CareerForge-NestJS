import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';
import { AuthGuard } from './auth.guard';
@Module({
  imports: [JwtModule.register({}),MailModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports:[AuthGuard, JwtModule]
})
export class AuthModule {}
