// types/resume-section.ts
import { ExperienceLevel } from "prisma/generated/prisma/enums";

export enum ResumeSectionType {
  HEADER = 'header',
  SUMMARY = 'summary',
  EXPERIENCE = 'experience',
  EDUCATION = 'education',
  SKILLS = 'skills',
  PROJECTS = 'projects',
  CERTIFICATIONS = 'certifications',
  LINKS = 'links',
  AWARDS = 'awards',
  LANGUAGES = 'languages',
  VOLUNTEER = 'volunteer',
  OTHER = 'other',
}

export const SECTION_ALIASES: Record<ResumeSectionType, string[]> = {
  [ResumeSectionType.HEADER]: [
    "header",
    "contact",
    "contact information",
    "contact info",
    "contact details",
    "personal information",
    "personal info",
    "personal details",
  ],
 
  [ResumeSectionType.SUMMARY]: [
    "summary",
    "professional summary",
    "profile",
    "professional profile",
    "personal profile",
    "career summary",
    "career profile",
    "executive summary",
    "objective",
    "career objective",
    "about me",
    "about",
  ],
 
  [ResumeSectionType.EXPERIENCE]: [
    "experience",
    "work experience",
    "professional experience",
    "employment history",
    "work history",
    "career history",
    "relevant experience",
    "professional background",
    "internship experience",
    "internships",
  ],
 
  [ResumeSectionType.EDUCATION]: [
    "education",
    "academic background",
    "educational background",
    "academic qualifications",
    "academic history",
    "qualifications",
  ],
 
  [ResumeSectionType.SKILLS]: [
    "skills",
    "technical skills",
    "core skills",
    "key skills",
    "relevant skills",
    "additional skills",
    "competencies",
    "core competencies",
    "technical competencies",
    "areas of expertise",
    "technical proficiencies",
    "proficiencies",
    "expertise",
    "technologies",
    "tools and technologies",
    "tools & technologies",
  ],
 
  [ResumeSectionType.PROJECTS]: [
    "projects",
    "personal projects",
    "academic projects",
    "key projects",
    "notable projects",
    "selected projects",
    "project experience",
  ],
 
  [ResumeSectionType.CERTIFICATIONS]: [
    "certifications",
    "certificates",
    "certification",
    "professional certifications",
    "licenses",
    "licenses and certifications",
    "licenses & certifications",
    "courses",
    "training",
    "professional development",
  ],
 
  [ResumeSectionType.LINKS]: [
    "links",
    "online profiles",
    "social links",
    "social media",
    "online presence",
    "web presence",
  ],
 
  [ResumeSectionType.AWARDS]: [
    "awards",
    "honors",
    "honors and awards",
    "honours",
    "achievements",
    "accomplishments",
    "recognitions",
  ],
 
  [ResumeSectionType.LANGUAGES]: [
    "languages",
    "language skills",
    "language proficiency",
  ],
 
  [ResumeSectionType.VOLUNTEER]: [
    "volunteer",
    "volunteering",
    "volunteer experience",
    "community service",
    "community involvement",
  ],
 
  [ResumeSectionType.OTHER]: [],
};



export interface ExperienceItem {
  title: string | null;
  company: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface ExtractedSection {
  type: ResumeSectionType;
  heading: string;
  content: string;
  startLine: number;
  endLine: number;
}


export interface EducationItem {
  institution: string | null;
  degree: string | null;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface ExtractedSkill {
  name: string;
  category: string | null;
  proficiencyGuess: string | null;
}

export interface ProjectItem {
  name: string | null;
  description: string | null;
  technologies: string[];
  url: string | null;
}

export interface CertificationItem {
  name: string | null;
  issuer: string | null;
  date: string | null;
  url: string | null;
}

export interface ResumeLinks {
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  other: string[];
}

export interface ExtractedProfile {
  name: string | null;
  currentRole: string | null;
  yearsOfExperience: number | null;
  experienceLevel: ExperienceLevel | null;
}

export interface AwardItem {
  title: string | null;
  issuer: string | null;
  date: string | null;
  description: string | null;
}

export interface LanguageItem {
  language: string;
  proficiency: string | null;
}



