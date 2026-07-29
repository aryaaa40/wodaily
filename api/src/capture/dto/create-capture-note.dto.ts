import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCaptureNoteDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  content!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
