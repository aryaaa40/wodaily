import { IsOptional, IsString } from 'class-validator';

export class ListCaptureNotesDto {
  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
