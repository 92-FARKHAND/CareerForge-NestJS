import { Prisma } from 'prisma/generated/prisma/client';
import { VerifyResumeDto } from '../dto/verify-resume.dto';

export class ResumeDatabaseMapper {
  mapProfile(
    userId: string,
    data: VerifyResumeDto,
  ) {
    return {
      userId,

      name: data.name ?? null,

      currentRole:
        data.currentRole ?? null,

      yearsOfExperience:
        data.yearsOfExperience ?? null,

      experienceLevel:
        data.experienceLevel ?? null,

      // Profile.education is String
      education:
        data.education
          ?.map((education) =>
            [
              education.degree,
              education.field,
              education.institution,
            ]
              .filter(Boolean)
              .join(' - '),
          )
          .filter(Boolean)
          .join('\n') || null,

      // Profile.skills is String[]
      skills:
        data.skills?.map(
          (skill) => skill.name,
        ) ?? [],

      targetRole:
        data.targetRole ?? null,

      preferredCountry:
        data.preferredCountry ?? null,

      preferredCity:
        data.preferredCity ?? null,

      workMode:
        data.workMode ?? null,

      employmentType:
        data.employmentType ?? null,
    };
  }

  mapResumeVersion(
    data: VerifyResumeDto,
    rawText: string,
  ) {
    return {
      rawText,

      name: data.name ?? null,

      summary: data.summary ?? null,

      experience:
        data.experience as unknown as Prisma.InputJsonValue,

      education:
        data.education as unknown as Prisma.InputJsonValue,

      projects:
        data.projects as unknown as Prisma.InputJsonValue,

      certifications:
        data.certifications as unknown as Prisma.InputJsonValue,

      links:
        data.links as unknown as Prisma.InputJsonValue,

    };
  }

  mapCandidateSkills(
    data: VerifyResumeDto,
  ) {
    return data.skills ?? [];
  }
}
