import { IsIn, IsInt, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskDto {
  @IsNotEmpty()
  @IsIn(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'])
  status!: TaskStatus;

  @IsInt()
  position!: number;
}
