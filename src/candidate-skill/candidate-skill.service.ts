// candidate-skill/candidate-skill.service.ts

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
} from 'prisma/generated/prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import { ExtractedSkill } from 'src/resume/types/resume-sections';

@Injectable()
export class CandidateSkillService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ============================================================
  // Create Candidate Skills for a resume version
  // ============================================================

  async createMany(
    resumeVersionId: string,
    skills: ExtractedSkill[],
  ) {
    if (!skills.length) {
      return [];
    }

    const uniqueSkills =
      this.removeDuplicates(skills);

    await this.prisma.candidateSkill.createMany({
      data: uniqueSkills.map((skill) => ({
        resumeVersionId,

        name: skill.name.trim(),

        category:
          skill.category ?? null,

        proficiencyGuess:
          skill.proficiencyGuess ?? null,
      })),

      skipDuplicates: true,
    });

    return this.getByResumeVersion(
      resumeVersionId,
    );
  }

  // ============================================================
  // Sync Candidate Skills
  //
  // Makes database skills exactly match the verified skills.
  //
  // - New skills are created
  // - Existing skills are updated
  // - Removed skills are deleted
  // - Duplicate skills are removed
  // ============================================================

  async sync(
    tx: Prisma.TransactionClient,
    resumeVersionId: string,
    skills: ExtractedSkill[],
  ) {
    // ----------------------------------------------------------
    // 1. Make sure the resume version belongs to this user
    // ----------------------------------------------------------

    const resumeVersion =
      await tx.resumeVersion.findFirst({
        where: {
          id: resumeVersionId,
        },

        select: {
          id: true,
        },
      });

    if (!resumeVersion) {
      throw new NotFoundException(
        'Resume version not found',
      );
    }

    // ----------------------------------------------------------
    // 2. Remove duplicate skills from incoming data
    // ----------------------------------------------------------

    const uniqueSkills =
      this.removeDuplicates(skills ?? []);

    // ----------------------------------------------------------
    // 3. If user verified zero skills,
    //    delete all existing skills.
    // ----------------------------------------------------------

    if (!uniqueSkills.length) {
      await tx.candidateSkill.deleteMany({
        where: {
          resumeVersionId,
        },
      });

      return [];
    }

    // ----------------------------------------------------------
    // 4. Get existing skills
    // ----------------------------------------------------------

    const existingSkills =
      await tx.candidateSkill.findMany({
        where: {
          resumeVersionId,
        },
      });

    // ----------------------------------------------------------
    // 5. Build lookup maps using lowercase skill names
    // ----------------------------------------------------------

    const incomingMap =
      new Map<string, ExtractedSkill>();

    for (const skill of uniqueSkills) {
      incomingMap.set(
        skill.name.trim().toLowerCase(),
        skill,
      );
    }

    const existingMap =
      new Map<string, typeof existingSkills[number]>();

    for (const skill of existingSkills) {
      existingMap.set(
        skill.name.trim().toLowerCase(),
        skill,
      );
    }

    // ----------------------------------------------------------
    // 6. Delete skills that are no longer present
    // ----------------------------------------------------------

    const idsToDelete: string[] = [];

    for (const existingSkill of existingSkills) {
      const key =
        existingSkill.name.trim().toLowerCase();

      if (!incomingMap.has(key)) {
        idsToDelete.push(existingSkill.id);
      }
    }

    if (idsToDelete.length) {
      await tx.candidateSkill.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      });
    }

    // ----------------------------------------------------------
    // 7. Create new skills / update existing skills
    // ----------------------------------------------------------

    for (const skill of uniqueSkills) {
      const name = skill.name.trim();

      const key = name.toLowerCase();

      const existing =
        existingMap.get(key);

      if (existing) {
        await tx.candidateSkill.update({
          where: {
            id: existing.id,
          },

          data: {
            name,

            category:
              skill.category ?? null,

            proficiencyGuess:
              skill.proficiencyGuess ?? null,
          },
        });
      } else {
        await tx.candidateSkill.create({
          data: {
            resumeVersionId,

            name,

            category:
              skill.category ?? null,

            proficiencyGuess:
              skill.proficiencyGuess ?? null,
          },
        });
      }
    }

    // ----------------------------------------------------------
    // 8. Return final synchronized skills
    // ----------------------------------------------------------

    return tx.candidateSkill.findMany({
      where: {
        resumeVersionId,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }

  // ============================================================
  // Get all skills belonging to a resume version
  // ============================================================

  async getByResumeVersion(
    resumeVersionId: string,
  ) {
    return this.prisma.candidateSkill.findMany({
      where: {
        resumeVersionId,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }

  // ============================================================
  // Update a single skill
  // ============================================================

  async update(
    id: string,
    resumeVersionId: string,
    data: {
      name?: string;
      category?: string | null;
      proficiencyGuess?: string | null;
    },
  ) {
    const skill =
      await this.prisma.candidateSkill.findFirst({
        where: {
          id,
          resumeVersionId,
        },
      });

    if (!skill) {
      throw new NotFoundException(
        'Skill not found',
      );
    }

    return this.prisma.candidateSkill.update({
      where: {
        id,
      },

      data: {
        ...(data.name !== undefined && {
          name: data.name.trim(),
        }),

        ...(data.category !== undefined && {
          category: data.category,
        }),

        ...(data.proficiencyGuess !== undefined && {
          proficiencyGuess:
            data.proficiencyGuess,
        }),
      },
    });
  }

  // ============================================================
  // Add a single skill
  // ============================================================

  async add(
    resumeVersionId: string,
    data: {
      name: string;
      category?: string | null;
      proficiencyGuess?: string | null;
    },
  ) {
    return this.prisma.candidateSkill.create({
      data: {
        resumeVersionId,

        name: data.name.trim(),

        category:
          data.category ?? null,

        proficiencyGuess:
          data.proficiencyGuess ?? null,
      },
    });
  }

  // ============================================================
  // Remove duplicate skills
  // ============================================================

  private removeDuplicates(
    skills: ExtractedSkill[],
  ): ExtractedSkill[] {
    const skillMap =
      new Map<string, ExtractedSkill>();

    for (const skill of skills) {
      const name =
        skill.name?.trim();

      if (!name) {
        continue;
      }

      const key =
        name.toLowerCase();

      if (!skillMap.has(key)) {
        skillMap.set(key, {
          ...skill,
          name,
        });
      }
    }

    return Array.from(
      skillMap.values(),
    );
  }
}
