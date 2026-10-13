import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { CompatibilityService } from './compatibility.service';
import { AnalyzeCompatibilityDto } from './dto/compatibility-analyze.dto';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt_payload.interface';

@UseGuards(AuthGuard)
@Controller('compatibility')
export class CompatibilityController {
  constructor(
    private readonly compatibilityService: CompatibilityService,
  ) {}

  @Post(':resumeVersionId/analyze')
  async analyze(
    @CurrentUser() user: JwtPayload,

    @Param('resumeVersionId')
    resumeVersionId: string,

    @Body()
    dto: AnalyzeCompatibilityDto,
  ) {
    if (!resumeVersionId) {
      throw new BadRequestException(
        'Resume version ID is required',
      );
    }

    if (!dto) {
      throw new BadRequestException(
        'Compatibility analysis data is required',
      );
    }

    return this.compatibilityService.analyze(
      user.sub,
      resumeVersionId,
      dto,
    );
  }

  @Get()
  async getUserCompatibilityAnalyses(
    @CurrentUser() user: JwtPayload,
  ) {
    return this.compatibilityService.getUserCompatibilityAnalyses(
      user.sub,
    );
  }

@Delete(':id')
async deleteCompatibilityAnalysis(
  @CurrentUser() user: JwtPayload,
  @Param('id') analysisId: string,
) {
  return this.compatibilityService.deleteCompatibilityAnalysis(
    user.sub,
    analysisId,
  );
}
}
