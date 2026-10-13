-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('STUDENT', 'ENTRY_LEVEL', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "ResumeStatus" AS ENUM ('UPLOADED', 'PARSING', 'PARSED', 'FAILED');

-- CreateEnum
CREATE TYPE "AIJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SkillMatchType" AS ENUM ('MATCHED', 'PARTIAL', 'MISSING');

-- CreateEnum
CREATE TYPE "LearningTrack" AS ENUM ('OOP', 'DSA');

-- CreateEnum
CREATE TYPE "LessonCompletionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AssessmentDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AssessmentCategory" AS ENUM ('TECHNICAL_ROUND', 'OOP', 'DSA', 'ANALYTICS', 'PROBLEM_SOLVING');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TEXT_ANSWER', 'TECHNICAL_EXPLANATION', 'PSEUDOCODE');

-- CreateEnum
CREATE TYPE "AnswerCorrectness" AS ENUM ('CORRECT', 'PARTIAL', 'INCORRECT');

-- CreateEnum
CREATE TYPE "AttentionLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ReadinessLevel" AS ENUM ('NEEDS_IMPROVEMENT', 'DEVELOPING', 'GOOD', 'STRONG', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "JobRemoteType" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "AIOperation" AS ENUM ('RESUME_EXTRACTION', 'COMPATIBILITY_ANALYSIS', 'LEARNING_CONTENT_GENERATION', 'ASSESSMENT_GENERATION', 'ASSESSMENT_EVALUATION', 'JOB_MATCH', 'RECOMMENDATION');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMPATIBILITY_READY', 'ASSESSMENT_READY', 'ASSESSMENT_EVALUATED', 'LEARNING_REMINDER', 'SYSTEM');

-- CreateTable
CREATE TABLE "ai_usages" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "operation" "AIOperation" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "estimatedCost" DECIMAL(10,6) NOT NULL,
    "status" "AIJobStatus" NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_limit_configs" (
    "id" TEXT NOT NULL,
    "planName" TEXT NOT NULL DEFAULT 'free',
    "operation" "AIOperation" NOT NULL,
    "maxPerMonth" INTEGER NOT NULL,

    CONSTRAINT "usage_limit_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "difficulty" "AssessmentDifficulty" NOT NULL,
    "experienceLevel" "ExperienceLevel" NOT NULL,
    "generationStatus" "AIJobStatus" NOT NULL DEFAULT 'PENDING',
    "generationKey" TEXT NOT NULL,
    "failureReason" TEXT,
    "generationAttempts" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "category" "AssessmentCategory" NOT NULL,
    "difficulty" "AssessmentDifficulty" NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "options" JSONB,
    "expectedConcepts" JSONB NOT NULL,
    "evaluationCriteria" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "aiProvider" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_answers" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answerText" TEXT,
    "selectedOption" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_evaluations" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 10,
    "correctness" "AnswerCorrectness" NOT NULL,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "missingConcepts" JSONB NOT NULL,
    "feedback" TEXT NOT NULL,
    "recommendedStudyTopics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_evaluations" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "status" "AIJobStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "overallScore" INTEGER,
    "readinessLevel" "ReadinessLevel",
    "strongestCategory" "AssessmentCategory",
    "weakestCategory" "AssessmentCategory",
    "overallStrengths" JSONB,
    "overallWeaknesses" JSONB,
    "conceptsNeedingAttention" JSONB,
    "recommendedLearningPath" JSONB,
    "recruiterSummary" TEXT,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "promptVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_evaluations" (
    "id" TEXT NOT NULL,
    "assessmentEvaluationId" TEXT NOT NULL,
    "category" "AssessmentCategory" NOT NULL,
    "score" INTEGER NOT NULL,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "missingConcepts" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "attentionLevel" "AttentionLevel" NOT NULL,

    CONSTRAINT "category_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readiness_level_configs" (
    "id" TEXT NOT NULL,
    "level" "ReadinessLevel" NOT NULL,
    "minScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,

    CONSTRAINT "readiness_level_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByTokenHash" TEXT,
    "createdByIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_analyses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeVersionId" TEXT NOT NULL,
    "targetRole" TEXT,
    "jobDescription" TEXT,
    "status" "AIJobStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "overallScore" INTEGER,
    "technicalScore" INTEGER,
    "experienceScore" INTEGER,
    "projectsScore" INTEGER,
    "toolsScore" INTEGER,
    "roleAlignmentScore" INTEGER,
    "educationScore" INTEGER,
    "readinessLevel" "ReadinessLevel",
    "strengths" JSONB,
    "weaknesses" JSONB,
    "recommendations" JSONB,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "promptVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compatibility_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_skills" (
    "id" TEXT NOT NULL,
    "compatibilityAnalysisId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "matchType" "SkillMatchType" NOT NULL,

    CONSTRAINT "compatibility_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_scoring_configs" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "technicalSkillsWeight" INTEGER NOT NULL DEFAULT 30,
    "experienceWeight" INTEGER NOT NULL DEFAULT 20,
    "projectsWeight" INTEGER NOT NULL DEFAULT 20,
    "toolsWeight" INTEGER NOT NULL DEFAULT 15,
    "roleAlignmentWeight" INTEGER NOT NULL DEFAULT 10,
    "educationWeight" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compatibility_scoring_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "remoteType" "JobRemoteType",
    "employmentType" "EmploymentType",
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL,
    "applicationUrl" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_courses" (
    "id" TEXT NOT NULL,
    "track" "LearningTrack" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "learning_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_modules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "learning_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_lessons" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "concept" TEXT NOT NULL,
    "simpleExplanation" TEXT NOT NULL,
    "realWorldExample" TEXT NOT NULL,
    "pseudoCode" TEXT NOT NULL,
    "programmingExample" TEXT,
    "commonMistakes" JSONB NOT NULL,
    "miniQuiz" JSONB NOT NULL,
    "practiceQuestion" TEXT NOT NULL,

    CONSTRAINT "learning_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" "LessonCompletionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "learning_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "experienceLevel" "ExperienceLevel",
    "yearsOfExperience" INTEGER,
    "education" TEXT,
    "currentRole" TEXT,
    "targetRole" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredCountry" TEXT,
    "preferredCity" TEXT,
    "workMode" "WorkMode",
    "employmentType" "EmploymentType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'cloudinary',
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "status" "ResumeStatus" NOT NULL DEFAULT 'UPLOADED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "status" "AIJobStatus" NOT NULL DEFAULT 'PENDING',
    "rawText" TEXT,
    "name" TEXT,
    "summary" TEXT,
    "experience" JSONB,
    "education" JSONB,
    "projects" JSONB,
    "certifications" JSONB,
    "links" JSONB,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_skills" (
    "id" TEXT NOT NULL,
    "resumeVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "proficiencyGuess" TEXT,

    CONSTRAINT "candidate_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usages_userId_createdAt_idx" ON "ai_usages"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usages_operation_createdAt_idx" ON "ai_usages"("operation", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "usage_limit_configs_planName_operation_key" ON "usage_limit_configs"("planName", "operation");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_generationKey_key" ON "assessments"("generationKey");

-- CreateIndex
CREATE INDEX "assessments_userId_createdAt_idx" ON "assessments"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_questions_assessmentId_order_key" ON "assessment_questions"("assessmentId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_answers_questionId_key" ON "assessment_answers"("questionId");

-- CreateIndex
CREATE INDEX "assessment_answers_assessmentId_idx" ON "assessment_answers"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "question_evaluations_answerId_key" ON "question_evaluations"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "question_evaluations_questionId_key" ON "question_evaluations"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_evaluations_assessmentId_key" ON "assessment_evaluations"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "category_evaluations_assessmentEvaluationId_category_key" ON "category_evaluations"("assessmentEvaluationId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "readiness_level_configs_level_key" ON "readiness_level_configs"("level");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "compatibility_analyses_userId_createdAt_idx" ON "compatibility_analyses"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "compatibility_skills_compatibilityAnalysisId_idx" ON "compatibility_skills"("compatibilityAnalysisId");

-- CreateIndex
CREATE UNIQUE INDEX "compatibility_scoring_configs_version_key" ON "compatibility_scoring_configs"("version");

-- CreateIndex
CREATE INDEX "jobs_country_city_idx" ON "jobs"("country", "city");

-- CreateIndex
CREATE INDEX "jobs_title_idx" ON "jobs"("title");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_provider_externalId_key" ON "jobs"("provider", "externalId");

-- CreateIndex
CREATE INDEX "saved_jobs_userId_idx" ON "saved_jobs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_userId_jobId_key" ON "saved_jobs"("userId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_courses_track_key" ON "learning_courses"("track");

-- CreateIndex
CREATE UNIQUE INDEX "learning_modules_courseId_order_key" ON "learning_modules"("courseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "learning_lessons_moduleId_slug_key" ON "learning_lessons"("moduleId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "learning_lessons_moduleId_order_key" ON "learning_lessons"("moduleId", "order");

-- CreateIndex
CREATE INDEX "learning_progress_userId_idx" ON "learning_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_progress_userId_lessonId_key" ON "learning_progress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "resumes_userId_isActive_idx" ON "resumes"("userId", "isActive");

-- CreateIndex
CREATE INDEX "resume_versions_resumeId_idx" ON "resume_versions"("resumeId");

-- CreateIndex
CREATE INDEX "candidate_skills_name_idx" ON "candidate_skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_skills_resumeVersionId_name_key" ON "candidate_skills"("resumeVersionId", "name");

-- AddForeignKey
ALTER TABLE "ai_usages" ADD CONSTRAINT "ai_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_evaluations" ADD CONSTRAINT "question_evaluations_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "assessment_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_evaluations" ADD CONSTRAINT "question_evaluations_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_evaluations" ADD CONSTRAINT "assessment_evaluations_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_evaluations" ADD CONSTRAINT "category_evaluations_assessmentEvaluationId_fkey" FOREIGN KEY ("assessmentEvaluationId") REFERENCES "assessment_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_analyses" ADD CONSTRAINT "compatibility_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_analyses" ADD CONSTRAINT "compatibility_analyses_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "resume_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_skills" ADD CONSTRAINT "compatibility_skills_compatibilityAnalysisId_fkey" FOREIGN KEY ("compatibilityAnalysisId") REFERENCES "compatibility_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "learning_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_lessons" ADD CONSTRAINT "learning_lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "learning_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "learning_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "resume_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
