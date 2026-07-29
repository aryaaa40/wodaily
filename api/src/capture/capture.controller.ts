import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CaptureService } from './capture.service';
import { CreateCaptureNoteDto } from './dto/create-capture-note.dto';
import { ListCaptureNotesDto } from './dto/list-capture-notes.dto';

@Controller('capture-notes')
export class CaptureController {
  constructor(private readonly captureService: CaptureService) {}

  @Get()
  findAll(@Query() query: ListCaptureNotesDto) {
    return this.captureService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateCaptureNoteDto) {
    return this.captureService.create(dto.title, dto.content, dto.tags);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.captureService.remove(id);
  }
}
