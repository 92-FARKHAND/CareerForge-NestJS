// resume/resume.service.ts

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/prisma/prisma.service";
import { FileStorageService } from "src/file-storage/file-storage.service";
import { CandidateSkillService } from "src/candidate-skill/candidate-skill.service";
import { ResumeParser } from "./parsers/resume.parser";
import { ResumeDatabaseMapper } from "./mapper/resume-db.mapper";
import { VerifyResumeDto } from "./dto/verify-resume.dto";

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorageService: FileStorageService,
    private readonly candidateSkillService: CandidateSkillService,
    private readonly resumeParser: ResumeParser,
    private readonly resumeDatabaseMapper: ResumeDatabaseMapper,
  ) {}

////////////////////////// Upload + Parse Resume ////////////////////////////////////

  async uploadResume(
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        "Resume file is required",
      );
    }

    this.validateFile(file);

    let storageKey: string | null = null;
    let resumeId: string | null = null;

    try {
      
    // 1. Delete user's existing resume

    await this.deleteExistingResumes(
      userId,
    );

      // 1. Upload original resume to storage

      const uploadedFile =
        await this.fileStorageService.upload(
          file.buffer,
          {
            folder: "resumes",

            originalFileName:
              file.originalname,

            mimeType:
              file.mimetype,
          },
        );

      storageKey =
        uploadedFile.key;


      // 2. Create Resume record
      // - Previous resumes remain for history. (if we remove deleteExistingResume())
      // Only the new resume becomes active.
      //

      const resume =
        await this.prisma.$transaction(
          async (tx) => {
            await tx.resume.updateMany({
              where: {
                userId,
                isActive: true,
                deletedAt: null,
              },

              data: {
                isActive: false,
              },
            });

            return tx.resume.create({
              data: {
                userId,
                storageProvider: uploadedFile.provider,
                storageKey: uploadedFile.key,
                originalFileName: file.originalname,
                mimeType: file.mimetype,
                fileSizeBytes: file.size,
                status: "UPLOADED",
                isActive: true,
              },
              select: {
                id: true,
              },
            });
          },
        );

      resumeId = resume.id;

      // 3. Mark Resume as PARSING

      await this.prisma.resume.update({
        where: {
          id: resume.id,
        },

        data: {
          status: "PARSING",
        },
      });

      // 4. Parse PDF / DOCX

      const structuredResume =
        await this.resumeParser.parse(
          file.buffer,
          file.mimetype,
        );
        


// 5. Map and Update Profile
const profileData =
  this.resumeDatabaseMapper.mapProfile(
    userId,
    structuredResume,
  );

await this.prisma.profile.upsert({
  where: {
    userId,
  },
  update: {
    name: profileData.name,
    currentRole: profileData.currentRole,
    yearsOfExperience:
      profileData.yearsOfExperience,
    experienceLevel:
      profileData.experienceLevel,
    education:
      profileData.education,
    skills: profileData.skills,
  },
  create: {
    userId: profileData.userId,
    name: profileData.name,
    currentRole: profileData.currentRole,
    yearsOfExperience:
      profileData.yearsOfExperience,
    experienceLevel:
      profileData.experienceLevel,
    education:
      profileData.education,
    skills: profileData.skills,
  },
});

// 6.  Map StructuredResume → ResumeVersion data & Create ResumeVersion 
      const versionData =
        this.resumeDatabaseMapper.mapResumeVersion(
          structuredResume,
          structuredResume.rawText
        );


      const version =
        await this.prisma.resumeVersion.create({
          data: {
            ...versionData,

            resume: {
              connect: {
                id: resume.id,
              },
            },

            status: "COMPLETED",
          },
          select: {
            id: true,
            name: true,
            summary: true,
            experience: true,
            education: true,
            projects: true,
            certifications: true,
            links: true,
            createdAt: true,
          },
        });

      // 7. Extracted skills

      const skills =
        this.resumeDatabaseMapper
          .mapCandidateSkills(
            structuredResume,
          );

      // 8. Save CandidateSkill records

      await this.candidateSkillService.createMany(
        version.id,
        skills,
      );

      // 9. Mark Resume as PARSED

      await this.prisma.resume.update({
        where: {
          id: resume.id,
        },

        data: {
          status: "PARSED",
        },
      });

      // 10. Return response

      return {
        success: true,
        data: {
          resumeId: resume.id,
          versionId: version.id,
          status: "PARSED",
          profile:{
            name: version.name,
            summary: version.summary,
            experience: version.experience,
            education: version.education,
            projects: version.projects,
            certifications: version.certifications,
            links: version.links,
            skills,
          }
        },
        meta: null,
        error: null,
      };
    } catch (error) {

      // Mark Resume as FAILED

      console.error("Resume processing failed:", error);
      if (resumeId) {
        await this.markAsFailed(
          resumeId,
          error,
        );
      }

      // Cleanup uploaded file if processing failed

      if (storageKey) {
        try {
          await this.fileStorageService.delete(
            storageKey,
          );
        } catch (cleanupError) {
          console.error(
            "Failed to cleanup uploaded resume",
            {
              storageKey,

              cleanupError,
            },
          );
        }
      }

      // Preserve known validation errors

      if (
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to process resume",
      );
    }
  }

////////////////////////////////////// VERIFY PROFILE /////////////////////////////////

  /**
   * Verify a resume and persist the user's confirmed data.
   *
   * Updates:
   * - Profile
   * - ResumeVersion
   * - CandidateSkill
   *
   * All updates happen inside one transaction.
   */
async verifyResume(
  userId: string,
  resumeVersionId: string,
  dto: VerifyResumeDto,
) {
  // ============================================================
  // 1. Get the existing resume version
  // ============================================================
  //
  // ResumeVersion does NOT have userId directly.
  //
  // Relationship:
  //
  // User
  //   ↓
  // Resume
  //   ↓
  // ResumeVersion
  //
  // Therefore we verify ownership through:
  // resume: { userId }
  // ============================================================

  const existingResumeVersion =
    await this.prisma.resumeVersion.findFirst({
      where: {
        id: resumeVersionId,

        resume: {
          userId,
        },
      },

      select: {
        id: true,
        rawText: true,
      },
    });

  if (!existingResumeVersion) {
    throw new NotFoundException(
      'Resume version not found',
    );
  }

  // ============================================================
  // 2. Map verified data
  // ============================================================

  const profileData =
    this.resumeDatabaseMapper.mapProfile(
      userId,
      dto,
    );

  const resumeVersionData =
    this.resumeDatabaseMapper.mapResumeVersion(
      dto,
      existingResumeVersion.rawText ?? '',
    );

  const skills =
    this.resumeDatabaseMapper.mapCandidateSkills(
      dto,
    );

  // ============================================================
  // 3. Persist everything inside ONE transaction
  // ============================================================

  return this.prisma.$transaction(
    async (tx) => {
      // --------------------------------------------------------
      // Update Profile
      // --------------------------------------------------------

      const profile =
        await tx.profile.update({
          where: {
            userId,
          },

          data: profileData,
        });

      // --------------------------------------------------------
      // Update ResumeVersion
      // --------------------------------------------------------
      //
      // Experience, education, projects, certifications,
      // links and languages are stored as JSON on ResumeVersion.
      //
      // No separate Experience/Education service is required.
      // --------------------------------------------------------

      const resumeVersion =
        await tx.resumeVersion.update({
          where: {
            id: existingResumeVersion.id,
          },

          data: resumeVersionData,
        });

      // --------------------------------------------------------
      // Synchronize Candidate Skills
      // --------------------------------------------------------

      await this.candidateSkillService.sync(
        tx,
        resumeVersion.id,
        skills,
      );

      // --------------------------------------------------------
      // Return persisted data
      // --------------------------------------------------------

      return {
        profile,
        resumeVersion,
      };
    },
  );
}

  /**
   * Get the currently active resume for a user,
   * including all resume version details.
   */
  async getActiveResumeByUserId(userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: {
        userId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            skills: true,
          },
        },
      },
    });

    if (!resume) {
      throw new NotFoundException(
        `No active resume found for user ${userId}`,
      );
    }

    return resume;
  }

  /**
   * Get all resumes belonging to a user,
   * including all resume version details.
   */
  async getAllResumesByUserId(userId: string) {
    return this.prisma.resume.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            skills: true,
          },
        },
      },
    });
  }


/////////////////////////////////////////// Delete resume //////////////////////////////

async deleteResume(
  userId: string,
  resumeId: string,
) {
  // ----------------------------------------------------------
  // 1. Find resume owned by user
  // ----------------------------------------------------------

  const resume = await this.prisma.resume.findFirst({
    where: {
      id: resumeId,
      userId,
      deletedAt: null,
    },
    select: {
      id: true,
      storageKey: true,
      isActive: true,
    },
  });

  if (!resume) {
    throw new NotFoundException("Resume not found");
  }

  // ----------------------------------------------------------
  // 2. Delete related database records transactionally
  // ----------------------------------------------------------

  await this.prisma.$transaction(async (tx) => {
    // Find every version belonging to this resume.
    const resumeVersions = await tx.resumeVersion.findMany({
      where: {
        resumeId: resume.id,
      },
      select: {
        id: true,
      },
    });

    const resumeVersionIds = resumeVersions.map(
      (version) => version.id,
    );

    if (resumeVersionIds.length > 0) {
      // Delete compatibility analyses first because
      // CompatibilityAnalysis references ResumeVersion
      // with onDelete: Restrict.

      await tx.compatibilityAnalysis.deleteMany({
        where: {
          userId,
          resumeVersionId: {
            in: resumeVersionIds,
          },
        },
      });

      // CompatibilitySkill records are deleted automatically
      // because their relation uses onDelete: Cascade.
      // Alternatively, delete them explicitly if preferred.

      await tx.resumeVersion.deleteMany({
        where: {
          id: {
            in: resumeVersionIds,
          },
        },
      });
    }

    // Hard-delete the resume itself.
    await tx.resume.delete({
      where: {
        id: resume.id,
      },
    });

    // Do not reactivate an older resume here.
    // Its Cloudinary file may already have been deleted
    // when the newer resume was uploaded.
  });

  // ----------------------------------------------------------
  // 3. Delete Cloudinary file if this was the active resume
  // ----------------------------------------------------------

  if (resume.isActive && resume.storageKey) {
    try {
      await this.fileStorageService.delete(
        resume.storageKey,
      );
    } catch (error) {
      // Database deletion has already succeeded.
      // Log this so storage cleanup can be retried.

      console.error(
        "Failed to delete resume from Cloudinary",
        {
          resumeId: resume.id,
          storageKey: resume.storageKey,
          error,
        },
      );
    }
  }

  // ----------------------------------------------------------
  // 4. Return response
  // ----------------------------------------------------------

  return {
    success: true,
    data: {
      id: resume.id,
      deleted: true,
      deletedResumeVersions: true,
      deletedCompatibilityAnalyses: true,
    },
    meta: null,
    error: null,
  };
}

/////////////////////////////////////////// Update Profile //////////////////////////////
// async updateResumeVersion(
//   userId: string,
//   resumeVersionId: string,
//   data: {
//     name?: string | null;
//     summary?: string | null;
//     experience?: any;
//     education?: any;
//     projects?: any;
//     certifications?: any;
//     links?: any;
//   },
// ) {
//   const version = await this.prisma.resumeVersion.findFirst({
//     where: {
//       id: resumeVersionId,
//       resume: {
//         userId,
//       },
//     },
//   });

//   if (!version) {
//     throw new NotFoundException(
//       'Resume version not found',
//     );
//   }

//   return this.prisma.resumeVersion.update({
//     where: {
//       id: resumeVersionId,
//     },
//     data: {
//       ...(data.name !== undefined && {
//         name: data.name,
//       }),

//       ...(data.summary !== undefined && {
//         summary: data.summary,
//       }),

//       ...(data.experience !== undefined && {
//         experience: data.experience,
//       }),

//       ...(data.education !== undefined && {
//         education: data.education,
//       }),

//       ...(data.projects !== undefined && {
//         projects: data.projects,
//       }),

//       ...(data.certifications !== undefined && {
//         certifications: data.certifications,
//       }),

//       ...(data.links !== undefined && {
//         links: data.links,
//       }),
//     },
//   });



//      /**
//    * Delete all existing resumes belonging to a user.
//    *
//    * This removes:
//    * - ResumeVersion records
//    * - Resume records
//    * - Files from Cloudinary/storage
//    */
  async deleteExistingResumes(
    userId: string,
  ): Promise<void> {
    const resumes =
      await this.prisma.resume.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          storageKey: true,
        },
      });

    if (!resumes.length) {
      return;
    }

    // Delete files from Cloudinary/storage first
    for (const resume of resumes) {
      if (!resume.storageKey) {
        continue;
      }

      try {
        await this.fileStorageService.delete(
          resume.storageKey,
        );
      } catch (error) {
        console.error(
          `Failed to delete resume file: ${resume.storageKey}`,
          error,
        );

        throw new InternalServerErrorException(
          "Failed to delete existing resume file",
        );
      }
    }

    // Delete DB records
    // await this.prisma.$transaction(
    //   async (tx) => {
    //     // Delete versions first if there is a foreign key
    //     await tx.resumeVersion.deleteMany({
    //       where: {
    //         resumeId: {
    //           in: resumes.map(
    //             (resume) => resume.id,
    //           ),
    //         },
    //       },
    //     });

    //     await tx.resume.deleteMany({
    //       where: {
    //         id: {
    //           in: resumes.map(
    //             (resume) => resume.id,
    //           ),
    //         },
    //       },
    //     });
    //   },
    // );
  }


  ///////////////////////////////// Get all resumes for authenticated user //////////////////

  // async getUserResumes(
  //   userId: string,
  // ) {
  //   const resumes =
  //     await this.prisma.resume.findMany({
  //       where: {
  //         userId,
  //         deletedAt: null,
  //       },
  //       orderBy: {
  //         createdAt: "desc",
  //       },

  //       select: {
  //         id: true,
  //         originalFileName: true,
  //         mimeType: true,
  //         fileSizeBytes: true,
  //         status: true,
  //         isActive: true,
  //         createdAt: true,
  //         updatedAt: true,
  //         versions: {
  //           orderBy: {
  //             createdAt: "desc",
  //           },
  //           take: 1,
  //           select: {
  //             id: true,
  //             name: true,
  //             summary: true,
  //             status: true,
  //             createdAt: true,
  //             _count: {
  //               select: {
  //                 skills: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });

  //   return {
  //     success: true,
  //     data: resumes,
  //     meta: {
  //       total: resumes.length,
  //     },
  //     error: null,
  //   };
  // }

//////////////////////////////////////// Get single resume //////////////////////////
  // async getResumeById(
  //   userId: string,
  //   resumeId: string,
  // ) {
  //   const resume =
  //     await this.prisma.resume.findFirst({
  //       where: {
  //         id: resumeId,
  //         userId,
  //         deletedAt: null,
  //       },

  //       select: {
  //         id: true,
  //         originalFileName: true,
  //         mimeType: true,
  //         fileSizeBytes: true,
  //         status: true,
  //         isActive: true,
  //         createdAt: true,
  //         updatedAt: true,
  //         versions: {
  //           orderBy: {
  //             createdAt: "desc",
  //           },
  //           select: {
  //             id: true,
  //             status: true,
  //             name: true,
  //             summary: true,
  //             rawText: true,
  //             experience: true,
  //             education: true,
  //             projects: true,
  //             certifications: true,
  //             links: true,
  //             failureReason: true,
  //             createdAt: true,
  //             skills: {
  //               orderBy: {
  //                 name: "asc",
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });

  //   if (!resume) {
  //     throw new NotFoundException(
  //       "Resume not found",
  //     );
  //   }

  //   return {
  //     success: true,
  //     data: resume,
  //     meta: null,
  //     error: null,
  //   };
  // }

////////////////////////////////// Private helpers ////////////////////////////

  private validateFile(
    file: Express.Multer.File,
  ): void {
    const allowedMimeTypes = [
      "application/pdf",

      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const maxFileSize =
      10 * 1024 * 1024;

    if (
      !allowedMimeTypes.includes(
        file.mimetype,
      )
    ) {
      throw new BadRequestException(
        "Only PDF and DOCX files are supported",
      );
    }

    if (file.size > maxFileSize) {
      throw new BadRequestException(
        "Resume file must not exceed 10 MB",
      );
    }

    if (!file.buffer?.length) {
      throw new BadRequestException(
        "Resume file is empty",
      );
    }
  }

  private async markAsFailed(
    resumeId: string,
    error: unknown,
  ): Promise<void> {
    try {
      await this.prisma.resume.update({
        where: {
          id: resumeId,
        },

        data: {
          status: "FAILED",
        },
      });
    } catch (updateError) {
      console.error(
        "Failed to mark resume as FAILED",
        {
          resumeId,

          error,

          updateError,
        },
      );
    }
  }

}