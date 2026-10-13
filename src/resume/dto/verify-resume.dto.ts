import {
  ExtractedSkill,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  CertificationItem,
  ResumeLinks,
  AwardItem,
  LanguageItem,
} from '../types/resume-sections';

import {
  ExperienceLevel,
  WorkMode,
  EmploymentType,
} from 'prisma/generated/prisma/client';

export class VerifyResumeDto {
  // =========================
  // Resume/Profile fields
  // =========================

  name?: string;

  currentRole?: string;

  yearsOfExperience?: number;

  experienceLevel?: ExperienceLevel;

  // =========================
  // Resume sections
  // =========================

  summary?: string | null;

  experience?: ExperienceItem[];

  education?: EducationItem[];

  skills?: ExtractedSkill[];

  projects?: ProjectItem[];

  certifications?: CertificationItem[];

  links?: ResumeLinks;

  awards?: AwardItem[];

  languages?: LanguageItem[];

  // =========================
  // Profile-specific fields
  // =========================

  targetRole?: string;

  preferredCountry?: string;

  preferredCity?: string;

  workMode?: WorkMode;

  employmentType?: EmploymentType;
}
