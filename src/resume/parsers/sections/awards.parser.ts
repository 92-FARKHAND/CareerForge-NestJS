import { Injectable } from "@nestjs/common";
import { AwardParser } from "src/resume/types/parser-inetrfaces";
import {
  AwardItem,
  ExtractedSection,
} from "src/resume/types/resume-sections";
import {
  extractTrailingDate,
  stripBullet,
} from "../../utils/resume-text.utils"; // NOTE: adjust this relative path to wherever you place resume-text.util.ts
 
@Injectable()
export class DefaultAwardParser implements AwardParser {
  parse(section: ExtractedSection): AwardItem[] {
    const lines = section.content
      .split("\n")
      .map((line) => stripBullet(line.trim()))
      .filter(Boolean);
 
    return lines.map((line) => {
      const trailing = extractTrailingDate(line);
 
      return {
        title: trailing ? trailing.remainder : line,
        issuer: null,
        date: trailing ? trailing.date : null,
        description: null,
      };
    });
  }
}