import { VerifyResumeDto } from '../../resume/dto/verify-resume.dto';

export class AnalyzeCompatibilityDto extends VerifyResumeDto {
  /**
   * Optional job description.
   *
   * Option A:
   * User selects only a target role.
   *
   * Option B:
   * User provides a target role + complete job description.
   */
  jobDescription?: string | null;
}
