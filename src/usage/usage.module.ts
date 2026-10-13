import { Module } from '@nestjs/common';
import { UsageService } from './usage.service';

@Module({
  providers: [UsageService]
})
export class UsageModule {}
