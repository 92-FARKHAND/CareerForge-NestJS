import { Injectable } from "@nestjs/common";

import { DocumentParser } from "./document/document-parser.interface";
import { PdfParser } from "./document/pdf.parser";
import { DocxParser } from "./document/docx.parser";

import { SectionDetector } from "./text/section-dectector";

import {
  ResumeSectionType,
  ExtractedSection,
} from "../types/resume-sections";


import { StructuredResume } from "../types/structured-resume";

import { DefaultProfileParser as ProfileParser } from "./sections/profile.parser";
import { DefaultSummaryParser as SummaryParser } from "./sections/summary.parser";
import { DefaultExperienceParser as ExperienceParser } from "./sections/experience.parser";
import { DefaultEducationParser as EducationParser } from "./sections/education.parser";
import { DefaultSkillsParser as SkillsParser } from "./sections/skills.parser";
import { DefaultProjectParser as ProjectParser } from "./sections/projects.parser";
import { DefaultCertificationParser as CertificationParser } from "./sections/certifications.parser";
import { DefaultLinksParser as LinksParser } from "./sections/links.parser";
import { DefaultAwardParser as AwardParser } from "./sections/awards.parser";
import { DefaultLanguageParser as LanguageParser } from "./sections/language.parser";

@Injectable()
export class ResumeParser {
  constructor(
    private readonly pdfParser: PdfParser,
    private readonly docxParser: DocxParser,

    private readonly sectionDetector: SectionDetector,

    private readonly profileParser: ProfileParser,
    private readonly summaryParser: SummaryParser,
    private readonly experienceParser: ExperienceParser,
    private readonly educationParser: EducationParser,
    private readonly skillsParser: SkillsParser,
    private readonly projectParser: ProjectParser,
    private readonly certificationParser: CertificationParser,
    private readonly linksParser: LinksParser,
    private readonly awardParser: AwardParser,
    private readonly languageParser: LanguageParser,
  ) {}

  async parse(
    buffer: Buffer,
    mimeType: string,
  ): Promise<StructuredResume> {
    const documentParser =
      this.getDocumentParser(mimeType);

    const rawText =
      await documentParser.extractText(buffer);

    if (!rawText.trim()) {
      throw new Error(
        "No readable text found in resume",
      );
    }

    const sections =
      this.sectionDetector.detect(rawText);
      
    return this.parseSections(
      rawText,
      sections,
    );
  }

  private getDocumentParser(
    mimeType: string,
  ): DocumentParser {
    if (this.pdfParser.supports(mimeType)) {
      return this.pdfParser;
    }

    if (this.docxParser.supports(mimeType)) {
      return this.docxParser;
    }

    throw new Error(
      `Unsupported resume file type: ${mimeType}`,
    );
  }

  private parseSections(
    rawText: string,
    sections: ExtractedSection[],
  ): StructuredResume {
    const getSection = (
      type: ResumeSectionType,
    ): ExtractedSection | null => {
      return (
        sections.find(
          (section) => section.type === type,
        ) ?? null
      );
    };

    const profileSection = getSection(
      ResumeSectionType.HEADER,
    );

    const summarySection = getSection(
      ResumeSectionType.SUMMARY,
    );

    const experienceSection = getSection(
      ResumeSectionType.EXPERIENCE,
    );

    const educationSection = getSection(
      ResumeSectionType.EDUCATION,
    );

    const skillsSection = getSection(
      ResumeSectionType.SKILLS,
    );

    const projectsSection = getSection(
      ResumeSectionType.PROJECTS,
    );

    const certificationsSection = getSection(
      ResumeSectionType.CERTIFICATIONS,
    );

    const linksSection = getSection(
      ResumeSectionType.LINKS,
    );

    const awardsSection = getSection(
      ResumeSectionType.AWARDS,
    );

    const languagesSection = getSection(
      ResumeSectionType.LANGUAGES,
    );

    return {
      rawText,

      profile: profileSection
        ? this.profileParser.parse(profileSection)
        : {
            name: null,
            currentRole: null,
            yearsOfExperience: null,
            experienceLevel: null,
          },

      summary: summarySection
        ? this.summaryParser.parse(summarySection)
        : null,

      experience: experienceSection
        ? this.experienceParser.parse(
            experienceSection,
          )
        : [],

      education: educationSection
        ? this.educationParser.parse(
            educationSection,
          )
        : [],

      skills: skillsSection
        ? this.skillsParser.parse(
            skillsSection,
          )
        : [],

      projects: projectsSection
        ? this.projectParser.parse(
            projectsSection,
          )
        : [],

      certifications: certificationsSection
        ? this.certificationParser.parse(
            certificationsSection,
          )
        : [],

      links: linksSection
        ? this.linksParser.parse(
            linksSection,
          )
        : {
            linkedin: null,
            github: null,
            portfolio: null,
            other: [],
          },

      awards: awardsSection
        ? this.awardParser.parse(
            awardsSection,
          )
        : [],

      languages: languagesSection
        ? this.languageParser.parse(
            languagesSection,
          )
        : [],
    };
  }
}