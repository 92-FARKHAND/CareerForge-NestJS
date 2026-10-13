import { Injectable } from "@nestjs/common";
import { SkillsParser } from "src/resume/types/parser-inetrfaces";
import {
  ExtractedSection,
  ExtractedSkill,
} from "src/resume/types/resume-sections";
import { stripBullet } from "../../utils/resume-text.utils";

const SPLIT_REGEX = /\s*[/,|;•●▪◦‣∙·\n]+\s*/;
const MAX_SKILL_WORDS = 6;
const MAX_SKILL_LENGTH = 60;

@Injectable()
export class DefaultSkillsParser implements SkillsParser {
  parse(section: ExtractedSection): ExtractedSkill[] {
    const values = section.content
      .split(SPLIT_REGEX)
      .map((value) => stripBullet(value).replace(/[.]+$/, "").trim())
      .filter(Boolean)
      .filter((value) => this.looksLikeSkill(value));

    const unique = new Map<string, ExtractedSkill>();

    for (const value of values) {
      const key = value.toLowerCase();

      if (!unique.has(key)) {
        unique.set(key, {
          name: value,
          category: null,
          proficiencyGuess: null,
        });
      }
    }

    return [...unique.values()];
  }

  private looksLikeSkill(value: string): boolean {
    if (value.length > MAX_SKILL_LENGTH) return false;
    if (/[.!?]$/.test(value)) return false;

    const wordCount = value.split(/\s+/).filter(Boolean).length;
    return wordCount <= MAX_SKILL_WORDS;
  }
}
