import { Module } from '@nestjs/common';

import { CompatibilityController } from './compatibility.controller';
import { CompatibilityService } from './compatibility.service';
import { CompatibilityScoringService } from './compatibility.scoring.service';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AiModule,
  ],
  controllers: [
    CompatibilityController,
  ],
  providers: [
    CompatibilityService,
    CompatibilityScoringService,
  ],
})
export class CompatibilityModule {}
