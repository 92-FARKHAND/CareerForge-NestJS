import { Injectable } from "@nestjs/common";
import { ExtractedSection } from "src/resume/types/resume-sections";
import { SummaryParser } from "../../types/parser-inetrfaces";
 
@Injectable()
export class DefaultSummaryParser implements SummaryParser {
  parse(section: ExtractedSection): string | null {
    const summary = section.content.replace(/\s+/g, " ").trim();
    return summary || null;
  }
}