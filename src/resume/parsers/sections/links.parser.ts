import { Injectable } from "@nestjs/common";
import { LinksParser } from "src/resume/types/parser-inetrfaces";
import {
  ExtractedSection,
  ResumeLinks,
} from "src/resume/types/resume-sections";
import { extractUrls } from "../../utils/resume-text.utils"; // NOTE: adjust this relative path to wherever you place resume-text.util.ts
 
const HOST_MATCHERS: Array<[field: "linkedin" | "github", pattern: RegExp]> = [
  ["linkedin", /linkedin\.com/i],
  ["github", /github\.com/i],
];
 
// Hosts that are clearly a "social/dev profile" rather than a personal
// portfolio site, so they don't get mistaken for the portfolio link.
const KNOWN_NON_PORTFOLIO_HOSTS =
  /gitlab\.com|behance\.net|dribbble\.com|medium\.com|stackoverflow\.com|twitter\.com|x\.com/i;
 
@Injectable()
export class DefaultLinksParser implements LinksParser {
  parse(section: ExtractedSection): ResumeLinks {
    const urls = extractUrls(section.content);
 
    const links: ResumeLinks = {
      linkedin: null,
      github: null,
      portfolio: null,
      other: [],
    };
 
    for (const url of urls) {
      const matcher = HOST_MATCHERS.find(([, pattern]) => pattern.test(url));
 
      if (matcher) {
        const [field] = matcher;
 
        if (!links[field]) {
          links[field] = url;
        } else {
          links.other.push(url);
        }
 
        continue;
      }
 
      if (!links.portfolio && !KNOWN_NON_PORTFOLIO_HOSTS.test(url)) {
        links.portfolio = url;
      } else {
        links.other.push(url);
      }
    }
 
    return links;
  }
}