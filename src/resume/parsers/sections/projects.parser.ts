import { Injectable } from "@nestjs/common";
import { ProjectParser } from "src/resume/types/parser-inetrfaces";
import {
  ExtractedSection,
  ProjectItem,
} from "src/resume/types/resume-sections";
import {
  cleanUrl,
  stripBullet,
  URL_REGEX,
} from "../../utils/resume-text.utils"; // NOTE: adjust this relative path to wherever you place resume-text.util.ts
 
const TECH_LINE_REGEX =
  /^(technologies|tech stack|stack|tech|tools|built with)\s*:/i;
 
@Injectable()
export class DefaultProjectParser implements ProjectParser {
  parse(section: ExtractedSection): ProjectItem[] {
    const lines = section.content
      .split("\n")
      .map((line) => stripBullet(line.trim()))
      .filter(Boolean);
 
    const items: ProjectItem[] = [];
    let current: ProjectItem | null = null;
 
    for (const line of lines) {
      if (!current) {
        current = { name: line, description: null, technologies: [], url: null };
        continue;
      }
 
      const urlMatch = line.match(URL_REGEX);
 
      if (urlMatch) {
        current.url = cleanUrl(urlMatch[0]);
        continue;
      }
 
      if (TECH_LINE_REGEX.test(line)) {
        const technologies = line
          .replace(TECH_LINE_REGEX, "")
          .split(/[,|]/)
          .map((item) => item.trim())
          .filter(Boolean);
 
        current.technologies.push(...technologies);
        continue;
      }
 
      current.description = current.description
        ? `${current.description} ${line}`
        : line;
    }
 
    if (current) {
      items.push(current);
    }
 
    return items;
  }
}