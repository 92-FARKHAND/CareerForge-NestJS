// types/structured-resume.ts

import { ExtractedProfile,EducationItem,ExperienceItem, ProjectItem, ExtractedSkill, CertificationItem, ResumeLinks, AwardItem,LanguageItem } from "./resume-sections";

export interface StructuredResume {
  profile: ExtractedProfile;

  summary: string | null;

  experience: ExperienceItem[];

  education: EducationItem[];

  skills: ExtractedSkill[];

  projects: ProjectItem[];

  certifications: CertificationItem[];

  links: ResumeLinks;

  awards: AwardItem[];

  languages: LanguageItem[];

  rawText: string;
}
