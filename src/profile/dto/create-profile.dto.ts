
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  EmploymentType,
  ExperienceLevel,
  WorkMode,
} from '../../../prisma/generated/prisma/client';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  education?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  currentRole?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  targetRole?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  preferredCountry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  preferredCity?: string;

  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;
}

