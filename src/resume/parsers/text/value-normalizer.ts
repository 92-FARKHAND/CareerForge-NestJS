import { ExperienceLevel } from "prisma/generated/prisma/enums";

export class ValueNormalizer {
  experienceLevel(
    value: string | null,
  ): ExperienceLevel | null {
    if (!value) {
      return null;
    }

    const normalized = value
      .toLowerCase()
      .trim();

    if (normalized.includes("student")) {
      return ExperienceLevel.STUDENT;
    }

    if (normalized.includes("entry")) {
      return ExperienceLevel.ENTRY_LEVEL;
    }

    if (normalized.includes("junior")) {
      return ExperienceLevel.JUNIOR;
    }

    if (normalized.includes("mid")) {
      return ExperienceLevel.MID_LEVEL;
    }

    if (normalized.includes("senior")) {
      return ExperienceLevel.SENIOR;
    }

    if (normalized.includes("lead")) {
      return ExperienceLevel.LEAD;
    }

    return null;
  }
}