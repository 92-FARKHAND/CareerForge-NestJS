import { Injectable , NotFoundException} from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createProfile(
    userId: string,
    data: CreateProfileDto,
  ) {
    return this.prisma.profile.create({
      data: {
        userId,

        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.experienceLevel !== undefined && {
          experienceLevel: data.experienceLevel,
        }),

        ...(data.yearsOfExperience !== undefined && {
          yearsOfExperience: data.yearsOfExperience,
        }),

        ...(data.education !== undefined && {
          education: data.education,
        }),

        ...(data.currentRole !== undefined && {
          currentRole: data.currentRole,
        }),

        ...(data.targetRole !== undefined && {
          targetRole: data.targetRole,
        }),

        ...(data.preferredCountry !== undefined && {
          preferredCountry: data.preferredCountry,
        }),

        ...(data.preferredCity !== undefined && {
          preferredCity: data.preferredCity,
        }),

        ...(data.workMode !== undefined && {
          workMode: data.workMode,
        }),

        ...(data.employmentType !== undefined && {
          employmentType: data.employmentType,
        }),
      },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.prisma.profile.update({
      where: {
        userId,
      },
      data: {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.experienceLevel !== undefined && {
          experienceLevel: data.experienceLevel,
        }),

        ...(data.yearsOfExperience !== undefined && {
          yearsOfExperience: data.yearsOfExperience,
        }),

        ...(data.education !== undefined && {
          education: data.education,
        }),

        ...(data.currentRole !== undefined && {
          currentRole: data.currentRole,
        }),

        ...(data.targetRole !== undefined && {
          targetRole: data.targetRole,
        }),

        ...(data.preferredCountry !== undefined && {
          preferredCountry: data.preferredCountry,
        }),

        ...(data.preferredCity !== undefined && {
          preferredCity: data.preferredCity,
        }),

        ...(data.workMode !== undefined && {
          workMode: data.workMode,
        }),

        ...(data.employmentType !== undefined && {
          employmentType: data.employmentType,
        }),
      },
    });
  }

 
  findAll() {
    return `This action returns all profile`;
  }

  findOne(id: number) {
    return `This action returns a #${id} profile`;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
