import { Injectable } from '@nestjs/common';

import {
  CompatibilityAIResult,
} from './schema/compatibility.ai.schema';

import {
  CompatibilityScoringConfig,
  ReadinessLevel,
} from 'prisma/generated/prisma/client';

@Injectable()
export class CompatibilityScoringService {
  calculateScores(
    result: CompatibilityAIResult,
    config: CompatibilityScoringConfig,
  ) {
    const technicalScore =
      this.calculateTechnicalScore(result);

    const experienceScore =
      this.calculateExperienceScore(result);

    const projectsScore =
      this.calculateProjectsScore(result);

    const toolsScore =
      this.calculateToolsScore(result);

    const roleAlignmentScore =
      this.calculateRoleAlignmentScore(result);

    const educationScore =
      this.calculateEducationScore(result);

    const overallScore =
      Math.round(
        (
          technicalScore *
            config.technicalSkillsWeight +
          experienceScore *
            config.experienceWeight +
          projectsScore *
            config.projectsWeight +
          toolsScore *
            config.toolsWeight +
          roleAlignmentScore *
            config.roleAlignmentWeight +
          educationScore *
            config.educationWeight
        ) / 100,
      );

    return {
      technicalScore,
      experienceScore,
      projectsScore,
      toolsScore,
      roleAlignmentScore,
      educationScore,
      overallScore,
    };
  }

  calculateReadinessLevel(
    overallScore: number,
  ): ReadinessLevel {
    if (overallScore >= 85) {
      return ReadinessLevel.EXCELLENT;
    }

    if (overallScore >= 70) {
      return ReadinessLevel.STRONG;
    }

    if (overallScore >= 50) {
      return ReadinessLevel.GOOD;
    }

    if (overallScore >= 30) {
      return ReadinessLevel.DEVELOPING;
    }

    return ReadinessLevel.NEEDS_IMPROVEMENT;
  }

  private calculateTechnicalScore(
    result: CompatibilityAIResult,
  ): number {
    const skills =
      result.skillAnalysis;

    if (!skills.length) {
      return 0;
    }

    const points = skills.reduce(
      (total, skill) => {
        if (
          skill.matchType === 'MATCHED'
        ) {
          return total + 100;
        }

        if (
          skill.matchType === 'PARTIAL'
        ) {
          return total + 50;
        }

        return total;
      },
      0,
    );

    return this.clamp(
      Math.round(points / skills.length),
    );
  }

  private calculateExperienceScore(
    result: CompatibilityAIResult,
  ): number {
    const candidateYears =
      result.experienceAnalysis.candidateYears;

    const relevantYears =
      result.experienceAnalysis.relevantYears;

    if (candidateYears <= 0) {
      return 0;
    }

    const relevanceRatio =
      Math.min(
        relevantYears / candidateYears,
        1,
      );

    return this.clamp(
      Math.round(relevanceRatio * 100),
    );
  }

  private calculateProjectsScore(
    result: CompatibilityAIResult,
  ): number {
    const count =
      result.projectAnalysis.projectCount;

    if (count <= 0) {
      return 0;
    }

    return this.clamp(
      Math.min(count * 25, 100),
    );
  }

  private calculateToolsScore(
    result: CompatibilityAIResult,
  ): number {
    const required =
      result.toolsAnalysis.requiredTools;

    const matched =
      result.toolsAnalysis.matchedTools;

    if (!required.length) {
      return 100;
    }

    const score =
      (matched.length / required.length) *
      100;

    return this.clamp(
      Math.round(score),
    );
  }

  private calculateRoleAlignmentScore(
    result: CompatibilityAIResult,
  ): number {
    switch (
      result.roleAlignmentAnalysis.alignment
    ) {
      case 'STRONG':
        return 100;

      case 'MODERATE':
        return 60;

      case 'WEAK':
        return 25;

      default:
        return 0;
    }
  }

  private calculateEducationScore(
    result: CompatibilityAIResult,
  ): number {
    return result.educationAnalysis.matched
      ? 100
      : 0;
  }

  private clamp(value: number): number {
    return Math.max(
      0,
      Math.min(100, value),
    );
  }
}
