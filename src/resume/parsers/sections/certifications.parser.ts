import { Injectable } from "@nestjs/common";
import { CertificationParser } from "src/resume/types/parser-inetrfaces";
import {
  CertificationItem,
  ExtractedSection,
} from "src/resume/types/resume-sections";
import {
  cleanUrl,
  extractTrailingDate,
  stripBullet,
  URL_REGEX,
} from "../../utils/resume-text.utils"; // NOTE: adjust this relative path to wherever you place resume-text.util.ts
 
const PART_SEPARATOR = /\s*(?:[-–—]|\|)\s*/;
 
@Injectable()
export class DefaultCertificationParser implements CertificationParser {
  parse(section: ExtractedSection): CertificationItem[] {
    const lines = section.content
      .split(/\r?\n/)
      .map((line) => stripBullet(line.trim()))
      .filter(Boolean);
 
    const certifications: CertificationItem[] = [];
 
    for (const line of lines) {
      const certification = this.parseLine(line);
 
      if (certification) {
        certifications.push(certification);
      }
    }
 
    return certifications;
  }
 
  private parseLine(line: string): CertificationItem | null {
    const urlMatch = line.match(URL_REGEX);
    const url = urlMatch ? cleanUrl(urlMatch[0]) : null;
 
    const withoutUrl = (url ? line.replace(urlMatch![0], "") : line).trim();
 
    const trailing = extractTrailingDate(withoutUrl);
    const text = trailing ? trailing.remainder : withoutUrl;
    const date = trailing ? trailing.date : null;
 
    const parts = text
      .split(PART_SEPARATOR)
      .map((part) => part.trim())
      .filter(Boolean);
 
    if (!parts.length) {
      return null;
    }
 
    return {
      name: parts[0],
      issuer: parts[1] ?? null,
      date: date ?? parts[2] ?? null,
      url,
    };
  }
}