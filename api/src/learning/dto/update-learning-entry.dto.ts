import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateLearningEntryDto {
  @IsOptional()
  @IsString()
  problemStatement?: string;

  @IsOptional()
  @IsString()
  attemptLog?: string;

  @IsOptional()
  @IsString()
  researchNotes?: string;

  @IsOptional()
  @IsString()
  reflection?: string;

  @IsOptional()
  @IsIn(['PROBLEM', 'ATTEMPT', 'LEARNED'])
  status?: 'PROBLEM' | 'ATTEMPT' | 'LEARNED';
}
