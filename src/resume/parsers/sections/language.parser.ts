import { Injectable } from "@nestjs/common";
import { LanguageParser } from "src/resume/types/parser-inetrfaces";
import {
  ExtractedSection,
  LanguageItem,
} from "src/resume/types/resume-sections";
import { stripBullet } from "../../utils/resume-text.utils"; // NOTE: adjust this relative path to wherever you place resume-text.util.ts
 
const PROFICIENCY_REGEX = /^(.*?)\s*\(([^)]+)\)\s*$/;
 
@Injectable()
export class DefaultLanguageParser implements LanguageParser {
  parse(section: ExtractedSection): LanguageItem[] {
    return section.content
      .split(/[,\n]/)
      .map((line) => stripBullet(line.trim()))
      .filter(Boolean)
      .map((entry) => this.toLanguageItem(entry));
  }
 
  private toLanguageItem(entry: string): LanguageItem {
    const match = entry.match(PROFICIENCY_REGEX);
 
    if (match) {
      return { language: match[1].trim(), proficiency: match[2].trim() };
    }
 
    return { language: entry, proficiency: null };
  }
}