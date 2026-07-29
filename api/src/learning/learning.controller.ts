import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LearningService } from './learning.service';
import { CreateLearningEntryDto } from './dto/create-learning-entry.dto';
import { ListLearningEntriesDto } from './dto/list-learning-entries.dto';
import { UpdateLearningEntryDto } from './dto/update-learning-entry.dto';
import { GeneralizeLearningEntryDto } from './dto/generalize-learning-entry.dto';

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLearningEntryDto) {
    return this.learningService.update(id, dto);
  }

  @Post(':id/generalize')
  generalize(@Param('id') id: string, @Body() dto: GeneralizeLearningEntryDto) {
    return this.learningService.generalizeToCapture(id, dto.title, dto.tags);
  }
}
