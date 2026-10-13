import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { AnalyzeCompatibilityDto } from './dto/compatibility-analyze.dto'

import { CompatibilityResponseDto } from './dto/compatibility-response.dto';

import { GeminiService } from '../ai/ai.service';

import { CompatibilityScoringService } from './compatibility.scoring.service';

@Injectable()
export class CompatibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly scoringService: CompatibilityScoringService,
  ) {}

  ///////// Analysis ///////////
  async analyze(
    userId: string,
    resumeVersionId: string,
    dto: AnalyzeCompatibilityDto,
  ): Promise<CompatibilityResponseDto> {
    // ============================================================
    // 1. Verify resume version belongs to user
    // ============================================================

    const resumeVersion =
      await this.prisma.resumeVersion.findFirst({
        where: {
          id: resumeVersionId,
          resume: {
            userId,
          },
        },
      });

    if (!resumeVersion) {
      throw new NotFoundException(
        'Resume version not found',
      );
    }

    // ============================================================
    // 2. Get active scoring configuration
    // ============================================================

    const scoringConfig =
      await this.prisma.compatibilityScoringConfig.findFirst({
        where: {
          isActive: true,
        },
      });

    if (!scoringConfig) {
      throw new NotFoundException(
        'Active compatibility scoring configuration not found',
      );
    }

    // ============================================================
    // 3. Ask Gemini for BASE analysis only
    // ============================================================

    const aiResult =
      await this.geminiService.analyzeCompatibility(
        dto,
      );

    // ============================================================
    // 4. Backend calculates scores
    // ============================================================

    const scores =
      this.scoringService.calculateScores(
        aiResult,
        scoringConfig,
      );

    // ============================================================
    // 5. Backend calculates readiness
    // ============================================================

    const readinessLevel =
      this.scoringService.calculateReadinessLevel(
        scores.overallScore,
      );

    // ============================================================
    // 6. Save immutable analysis
    // ============================================================

    const analysis =
      await this.prisma.compatibilityAnalysis.create({
        data: {
          userId,

          resumeVersionId,

          targetRole:
            dto.targetRole ?? null,

          jobDescription:
            dto.jobDescription ?? null,

          status: 'COMPLETED',

          failureReason: null,

          overallScore:
            scores.overallScore,

          technicalScore:
            scores.technicalScore,

          experienceScore:
            scores.experienceScore,

          projectsScore:
            scores.projectsScore,

          toolsScore:
            scores.toolsScore,

          roleAlignmentScore:
            scores.roleAlignmentScore,

          educationScore:
            scores.educationScore,

          readinessLevel:
            readinessLevel,

          strengths:
            aiResult.strengths,

          weaknesses:
            aiResult.weaknesses,

          recommendations:
            aiResult.recommendations,

          aiProvider: 'gemini',

          aiModel:
            process.env.GEMINI_MODEL ??
            'gemini-2.5-flash',

          promptVersion:
            process.env.COMPATIBILITY_PROMPT_VERSION ??
            'compatibility-v1',

          skills: {
            create:
              aiResult.skillAnalysis.map(
                (skill) => ({
                  skillName:
                    skill.skillName,

                  matchType:
                    skill.matchType as any,
                }),
              ),
          },

         // If you add this field to Prisma:
          scoringConfigVersion:
            scoringConfig.version,
        },

        include: {
          skills: true,
        },
      });

    // ============================================================
    // 7. Map DB result to API response
    // ============================================================

    return {
      id: analysis.id,

      resumeVersionId:
        analysis.resumeVersionId,

      targetRole:
        analysis.targetRole,

      jobDescription:
        analysis.jobDescription,

      status:
        analysis.status,

      failureReason:
        analysis.failureReason,

      scores: {
        overall:
          analysis.overallScore,

        technical:
          analysis.technicalScore,

        experience:
          analysis.experienceScore,

        projects:
          analysis.projectsScore,

        tools:
          analysis.toolsScore,

        roleAlignment:
          analysis.roleAlignmentScore,

        education:
          analysis.educationScore,
      },

      readinessLevel:
        analysis.readinessLevel,

      skills:
        analysis.skills.map(
          (skill) => ({
            skillName:
              skill.skillName,

            matchType:
              skill.matchType,
          }),
        ),

      strengths:
        this.toStringArray(
          analysis.strengths,
        ),

      weaknesses:
        this.toStringArray(
          analysis.weaknesses,
        ),

      recommendations:
        this.toStringArray(
          analysis.recommendations,
        ),

      meta: {
        aiProvider:
          analysis.aiProvider,

        aiModel:
          analysis.aiModel,

        promptVersion:
          analysis.promptVersion,

        scoringConfigVersion:
          null,
      },

      createdAt:
        analysis.createdAt,
    };
  }

  ////////// Find User related scoring ///////////////
  async getUserCompatibilityAnalyses(userId: string) {
  return this.prisma.compatibilityAnalysis.findMany({
    where: {
      resumeVersion: {
        resume: {
          userId,
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });
}

///////////////// Delete Analysis Record /////////////////
async deleteCompatibilityAnalysis(
  userId: string,
  analysisId: string,
) {
  const analysis =
    await this.prisma.compatibilityAnalysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
      select: {
        id: true,
      },
    });

  if (!analysis) {
    throw new NotFoundException(
      'Compatibility analysis not found',
    );
  }

  await this.prisma.compatibilityAnalysis.delete({
    where: {
      id: analysis.id,
    },
  });

  return {
    success: true,
    data: {
      id: analysis.id,
      deleted: true,
    },
    meta: null,
    error: null,
  };
}


  private toStringArray(
    value: unknown,
  ): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is string =>
        typeof item === 'string',
    );
  }
}
