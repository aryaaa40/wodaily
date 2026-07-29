import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLearningEntryDto {
  @IsNotEmpty()
  @IsString()
  taskId!: string;

  @IsNotEmpty()
  @IsString()
  problemStatement!: string;
}
