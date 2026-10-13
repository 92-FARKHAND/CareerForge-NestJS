import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { ProfileModule } from './profile/profile.module';
import { ResumeModule } from './resume/resume.module';
import { FileStorageService } from './file-storage/file-storage.service';
import { FileStorageModule } from './file-storage/file-storage.module';
import { CandidateSkillModule } from './candidate-skill/candidate-skill.module';
import { AiModule } from './ai/ai.module';
import { CompatibilityModule } from './compatibility/compatibility.module';
import { UsageModule } from './usage/usage.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, JwtModule.register({}),    
    ConfigModule.forRoot({
      isGlobal: true,
    }), MailModule, ProfileModule, ResumeModule, FileStorageModule, CandidateSkillModule, AiModule, CompatibilityModule, UsageModule, NotificationModule,],
  controllers: [AppController],
  providers: [AppService, PrismaService, AuthService],
})
export class AppModule {}
