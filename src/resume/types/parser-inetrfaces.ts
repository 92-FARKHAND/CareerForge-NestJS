
import {
  AwardItem,
  ExtractedSection,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  ResumeLinks,
  ProjectItem,
  ExtractedSkill,
  ExtractedProfile

} from "src/resume/types/resume-sections";

// award.parser.ts

export interface AwardParser {
  parse(section: ExtractedSection): AwardItem[];
}

// certification.parser.ts

export interface CertificationParser {
  parse(section: ExtractedSection): CertificationItem[];
}

// education.parser.ts

export interface EducationParser {
  parse(section: ExtractedSection): EducationItem[];
}

// experience.parser.ts

export interface ExperienceParser {
  parse(
    section: ExtractedSection,
  ): ExperienceItem[];
}

// language.parser.ts

export interface LanguageParser {
  parse(section: ExtractedSection): LanguageItem[];
}

// links.parser.ts

export interface LinksParser {
  parse(section: ExtractedSection): ResumeLinks;
}

// project.parser.ts

export interface ProjectParser {
  parse(section: ExtractedSection): ProjectItem[];
}

// skills.parser.ts

export interface SkillsParser {
  parse(section: ExtractedSection): ExtractedSkill[];
}

// summary.parser.ts

export interface SummaryParser {
  parse(section: ExtractedSection): string | null;
}

//profile.parser.ts
export interface ProfileParser {
  parse(
    section: ExtractedSection,
  ): ExtractedProfile;
}