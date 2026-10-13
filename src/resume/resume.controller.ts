// resume/resume.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Get,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import { ResumeService } from './resume.service';

import { AuthGuard } from '../auth/auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt_payload.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { VerifyResumeDto } from './dto/verify-resume.dto';

interface AuthenticatedUser {
  id: string;
}

@Controller('resumes')
@UseGuards(AuthGuard)
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
  ) {}

  // ============================================================
  // POST /resumes
  // Upload Resume
  // ============================================================

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },

      fileFilter: (
        _request,
        file,
        callback,
      ) => {
        const allowedMimeTypes = [
          'application/pdf',

          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (
          !allowedMimeTypes.includes(
            file.mimetype,
          )
        ) {
          return callback(
            new BadRequestException(
              'Only PDF and DOCX files are supported',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async uploadResume(
    @CurrentUser() user: JwtPayload,

    @UploadedFile()
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Resume file is required',
      );
    }

    return this.resumeService.uploadResume(
      user.sub,
      file,
    );
  }

  // ============================================================
  // POST /resumes/:resumeVersionId/verify
  //
  // Save the user's verified resume data.
  //
  // Updates:
  // - Profile
  // - ResumeVersion
  // - CandidateSkill
  //
  // All updates happen inside one transaction.
  // ============================================================

@Patch(':resumeVersionId/verify')
async verifyResume(
  @CurrentUser() user: JwtPayload,

  @Param('resumeVersionId')
  resumeVersionId: string,

  @Body()
  dto: VerifyResumeDto,
) {
  if (!resumeVersionId) {
    throw new BadRequestException(
      'Resume version ID is required',
    );
  }

  if (!dto) {
    throw new BadRequestException(
      'Resume verification data is required',
    );
  }

  return this.resumeService.verifyResume(
    user.sub,
    resumeVersionId,
    dto,
  );
}

@Get('active')
async getActiveResume(@CurrentUser() user: JwtPayload) {
  return this.resumeService.getActiveResumeByUserId(user.sub);
}

@Get()
async getAllResumes(@CurrentUser() user: JwtPayload) {
  return this.resumeService.getAllResumesByUserId(user.sub);
}


  // ============================================================
  // DELETE /resumes/:id
  // ============================================================

@Delete(':id')
async deleteResume(
  @CurrentUser() user: JwtPayload,
  @Param('id') resumeId: string,
) {
  return this.resumeService.deleteResume(
    user.sub,
    resumeId,
  );
}
}
