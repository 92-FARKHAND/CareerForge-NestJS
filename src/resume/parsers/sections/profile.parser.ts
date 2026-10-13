 
import { Injectable } from "@nestjs/common";
import {
  ExtractedProfile,
  ExtractedSection,
} from "src/resume/types/resume-sections";
import { ExperienceLevel } from "prisma/generated/prisma/enums";
import { ProfileParser } from "../../types/parser-inetrfaces";
import {
  extractEmail,
  extractPhone,
  extractUrls,
} from "../../utils/resume-text.utils"; // NOTE: adjust this relative path to wherever you place resume-text.util.ts
 
// Charset intentionally allows apostrophes/hyphens/periods (names, initials)
// and parens/&//  (job titles like "Full-Stack (MERN) Developer") while
// still excluding commas, which reliably show up in address/location lines.
const NAME_OR_ROLE_LINE_REGEX = /^[A-Za-z][A-Za-z'.\-\s()&/]{1,60}$/;
const MAX_NAME_OR_ROLE_WORDS = 6;
 
const YEARS_OF_EXPERIENCE_REGEX =
  /(\d+)\s*(?:-\s*\d+\s*)?\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience|over\s+(\d+)\s*(?:years?|yrs?)/i;
 
@Injectable()
export class DefaultProfileParser implements ProfileParser {
  parse(section: ExtractedSection): ExtractedProfile {
    const lines = section.content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
 
    const { name, currentRole } = this.extractNameAndRole(lines);
 
    return {
      name,
      currentRole,
      yearsOfExperience: this.extractYearsOfExperience(section.content),
      experienceLevel: this.extractExperienceLevel(section.content),
    };
  }
 
  private extractNameAndRole(lines: string[]): {
    name: string | null;
    currentRole: string | null;
  } {
    const candidates = lines.filter((line) => this.looksLikeNameOrRole(line));
 
    return {
      name: candidates[0] ?? null,
      currentRole: candidates[1] ?? null,
    };
  }
 
  /** A "name-or-role" line has no contact details and isn't a sentence. */
  private looksLikeNameOrRole(line: string): boolean {
    if (extractEmail(line) || extractPhone(line) || extractUrls(line).length) {
      return false;
    }
 
    if (/\d/.test(line)) {
      return false;
    }
 
    const wordCount = line.split(/\s+/).filter(Boolean).length;
 
    return (
      NAME_OR_ROLE_LINE_REGEX.test(line) && wordCount <= MAX_NAME_OR_ROLE_WORDS
    );
  }
 
  private extractYearsOfExperience(text: string): number | null {
    const match = text.match(YEARS_OF_EXPERIENCE_REGEX);
 
    if (!match) {
      return null;
    }
 
    return Number(match[1] ?? match[2]);
  }
 
  private extractExperienceLevel(text: string): ExperienceLevel | null {
    const value = text.toLowerCase();
 
    if (value.includes("lead")) {
      return ExperienceLevel.LEAD;
    }
 
    if (value.includes("senior")) {
      return ExperienceLevel.SENIOR;
    }
 
    if (value.includes("mid-level") || value.includes("mid level")) {
      return ExperienceLevel.MID_LEVEL;
    }
 
    if (value.includes("junior")) {
      return ExperienceLevel.JUNIOR;
    }
 
    if (value.includes("entry level")) {
      return ExperienceLevel.ENTRY_LEVEL;
    }
 
    if (value.includes("student")) {
      return ExperienceLevel.STUDENT;
    }
 
    return null;
  }
}