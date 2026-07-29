import { IsOptional, IsString } from 'class-validator';

export class ListLearningEntriesDto {
  @IsOptional()
  @IsString()
  taskId?: string;
}
