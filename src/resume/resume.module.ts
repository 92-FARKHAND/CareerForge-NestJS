import { Module } from "@nestjs/common";

import { ResumeController } from "./resume.controller";
import { ResumeService } from "./resume.service";
import { FileStorageModule } from 'src/file-storage/file-storage.module';
import { ResumeDatabaseMapper } from "./mapper/resume-db.mapper";
import { ResumeParser } from "./parsers/resume.parser";

import { PdfParser } from "./parsers/document/pdf.parser";
import { DocxParser } from "./parsers/document/docx.parser";

import { TextNormalizer } from "./parsers/text/text-normalizer";
import { SectionClassifier } from "./parsers/text/section-classifier";
import { SectionDetector } from "./parsers/text/section-dectector";

import { DefaultProfileParser as ProfileParser } from "./parsers/sections/profile.parser";
import { DefaultSummaryParser as SummaryParser } from "./parsers/sections/summary.parser";
import { DefaultExperienceParser as ExperienceParser } from "./parsers/sections/experience.parser";
import { DefaultEducationParser as EducationParser } from "./parsers/sections/education.parser";
import { DefaultSkillsParser as SkillsParser } from "./parsers/sections/skills.parser";
import { DefaultProjectParser as ProjectParser } from "./parsers/sections/projects.parser";
import { DefaultCertificationParser as CertificationParser } from "./parsers/sections/certifications.parser";
import { DefaultLinksParser as LinksParser } from "./parsers/sections/links.parser";
import { DefaultAwardParser as AwardParser } from "./parsers/sections/awards.parser";
import {DefaultLanguageParser as LanguageParser } from "./parsers/sections/language.parser";
import { PrismaModule } from "src/prisma/prisma.module";
import { CandidateSkillModule } from "src/candidate-skill/candidate-skill.module";
import { AuthModule } from "src/auth/auth.module";

@Module({
    imports: [
    FileStorageModule,
    PrismaModule,
    CandidateSkillModule,
    AuthModule,
  ],
  controllers: [
    ResumeController,
  ],

  providers: [
    ResumeService,

    ResumeParser,

    PdfParser,
    DocxParser,

    SectionClassifier,
    SectionDetector,

    TextNormalizer,
    SectionClassifier,
    SectionDetector,

    ProfileParser,
    SummaryParser,
    ExperienceParser,
    EducationParser,
    SkillsParser,
    ProjectParser,
    CertificationParser,
    LinksParser,
    AwardParser,
    LanguageParser,

    ResumeDatabaseMapper,
  ],

  exports: [
    ResumeService,
  ],
})
export class ResumeModule {}