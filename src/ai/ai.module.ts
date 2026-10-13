import { Module } from '@nestjs/common';
import { GeminiService } from './ai.service';

@Module({
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AiModule {}
