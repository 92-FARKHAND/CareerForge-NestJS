import { Injectable } from "@nestjs/common";
import { EducationParser } from "src/resume/types/parser-inetrfaces";
import {
  EducationItem,
  ExtractedSection,
} from "src/resume/types/resume-sections";

import {
  extractTrailingDate,
  findDateRange,
  isDegreeLine,
  stripBullet,
} from "../../utils/resume-text.utils";

@Injectable()
export class DefaultEducationParser implements EducationParser {
  parse(section: ExtractedSection): EducationItem[] {
    const lines = this.normalizeLines(section.content);

    const items: EducationItem[] = [];
    let current: EducationItem | null = null;

    for (const line of lines) {
      // Handle compact formats such as:
      // "BS Software Engineering · Northwest Tech · 2022"
      const compact = this.parseCompactEducation(line);

      if (compact) {
        if (current && this.hasContent(current)) {
          items.push(current);
        }

        current = compact;
        continue;
      }

      const dateRange = findDateRange(line);

      // A new degree after an existing education entry means
      // we are starting another education record.
      if (
        current &&
        this.isComplete(current) &&
        (isDegreeLine(line) || !!dateRange)
      ) {
        items.push(current);
        current = null;
      }

      current ??= this.createEducation();

      if (dateRange) {
        this.applyDateRange(current, line, dateRange);
        continue;
      }

      if (isDegreeLine(line)) {
        if (!current.degree) {
          current.degree = line;
        } else {
          current.description = this.append(
            current.description,
            line,
          );
        }

        continue;
      }

      const trailingDate = extractTrailingDate(line);

      if (trailingDate) {
        this.applyTrailingDate(current, trailingDate);
        continue;
      }

      if (!current.institution) {
        current.institution = line;
        continue;
      }

      if (!current.degree) {
        current.degree = line;
        continue;
      }

      if (!current.field) {
        current.field = line;
        continue;
      }

      current.description = this.append(
        current.description,
        line,
      );
    }

    if (current && this.hasContent(current)) {
      items.push(current);
    }

    return items;
  }

  /**
   * Remove bullets, whitespace and empty lines once,
   * instead of repeatedly doing it throughout the parser.
   */
  private normalizeLines(content: string): string[] {
    return content
      .split(/\r?\n/)
      .map((line) => stripBullet(line.trim()))
      .filter(Boolean);
  }

  /**
   * Handles common one-line education formats:
   *
   * BS Software Engineering · Northwest Tech · 2022
   * BS Computer Science | MIT | 2023
   * BS Computer Science - MIT - 2023
   */
  private parseCompactEducation(line: string): EducationItem | null {
    const parts = line
      .split(/\s*[·|]\s*|\s+-\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length < 2) {
      return null;
    }

    const degreeIndex = parts.findIndex((part) =>
      isDegreeLine(part),
    );

    if (degreeIndex === -1) {
      return null;
    }

    const degree = parts[degreeIndex];

    const remaining = parts.filter(
      (_, index) => index !== degreeIndex,
    );

    const result = this.createEducation();

    result.degree = degree;

    for (const part of remaining) {
      const dateRange = findDateRange(part);

      if (dateRange) {
        result.startDate = dateRange.startDate;
        result.endDate = dateRange.endDate;
        continue;
      }

      const trailingDate = extractTrailingDate(part);

      if (trailingDate) {
        if (!result.institution) {
          result.institution = trailingDate.remainder;
        }

        result.endDate ??= trailingDate.date;
        continue;
      }

      if (!result.institution) {
        result.institution = part;
      } else if (!result.field) {
        result.field = part;
      } else {
        result.description = this.append(
          result.description,
          part,
        );
      }
    }

    return result;
  }

  private applyDateRange(
    item: EducationItem,
    line: string,
    dateRange: {
      startDate: string;
      endDate: string;
      raw: string;
    },
  ): void {
    item.startDate ??= dateRange.startDate;
    item.endDate ??= dateRange.endDate;

    // Example:
    // "Northwest Tech 2020 - 2022"
    const remainder = line
      .replace(dateRange.raw, "")
      .replace(/^[\s,|·-]+|[\s,|·-]+$/g, "")
      .trim();

    if (remainder && !item.institution) {
      item.institution = remainder;
    }
  }

  private applyTrailingDate(
    item: EducationItem,
    trailing: {
      date: string;
      remainder: string;
    },
  ): void {
    item.endDate ??= trailing.date;

    if (trailing.remainder && !item.institution) {
      item.institution = trailing.remainder;
    }
  }

  private isComplete(item: EducationItem): boolean {
    return Boolean(item.institution && item.degree);
  }

  private hasContent(item: EducationItem): boolean {
    return Boolean(
      item.institution ||
        item.degree ||
        item.field ||
        item.startDate ||
        item.endDate ||
        item.description,
    );
  }

  private append(
    current: string | null,
    value: string,
  ): string {
    return current ? `${current} ${value}` : value;
  }

  private createEducation(): EducationItem {
    return {
      institution: null,
      degree: null,
      field: null,
      startDate: null,
      endDate: null,
      description: null,
    };
  }
}
