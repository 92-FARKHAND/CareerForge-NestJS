// candidate-skill/candidate-skill.module.ts

import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { CandidateSkillService } from './candidate-skill.service';

@Module({
  imports: [
    PrismaModule,
  ],

  providers: [
    CandidateSkillService,
  ],

  exports: [
    CandidateSkillService,
  ],
})
export class CandidateSkillModule {}