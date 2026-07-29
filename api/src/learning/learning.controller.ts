import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LearningService } from './learning.service';
import { CreateLearningEntryDto } from './dto/create-learning-entry.dto';
import { ListLearningEntriesDto } from './dto/list-learning-entries.dto';

@Controller('learning-entries')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get()
  findAll(@Query() query: ListLearningEntriesDto) {
    return this.learningService.findAll(query.taskId);
  }

  @Post()
  create(@Body() dto: CreateLearningEntryDto) {
    return this.learningService.create(dto.taskId, dto.problemStatement);
  }
}
