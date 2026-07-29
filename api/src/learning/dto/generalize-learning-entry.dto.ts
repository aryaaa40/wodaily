import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GeneralizeLearningEntryDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
