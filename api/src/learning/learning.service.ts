import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningEntryStatus } from '@prisma/client';

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  async create(taskId: string, problemStatement: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    return this.prisma.learningEntry.create({
      data: { taskId, problemStatement, status: LearningEntryStatus.PROBLEM },
    });
  }

  findAll(taskId?: string) {
    return this.prisma.learningEntry.findMany({
      where: taskId ? { taskId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    data: {
      problemStatement?: string;
      attemptLog?: string;
      researchNotes?: string;
      reflection?: string;
      status?: LearningEntryStatus;
    },
  ) {
    const existing = await this.prisma.learningEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Learning entry ${id} not found`);
    }

    const resultingAttemptLog = data.attemptLog ?? existing.attemptLog;
    const resultingReflection = data.reflection ?? existing.reflection;

    if (data.researchNotes !== undefined && !resultingAttemptLog) {
      throw new BadRequestException('Cannot add research notes before logging an attempt');
    }
    if (data.status === LearningEntryStatus.ATTEMPT && !resultingAttemptLog) {
      throw new BadRequestException('Cannot move to ATTEMPT without an attempt log');
    }
    if (data.status === LearningEntryStatus.LEARNED && !resultingReflection) {
      throw new BadRequestException('Cannot move to LEARNED without a reflection');
    }

    return this.prisma.learningEntry.update({ where: { id }, data });
  }

  async generalizeToCapture(id: string, title: string, tags: string[] = []) {
    const entry = await this.prisma.learningEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Learning entry ${id} not found`);
    }
    if (entry.status !== LearningEntryStatus.LEARNED || !entry.reflection) {
      throw new BadRequestException('Can only generalize a learned entry that has a reflection');
    }
    if (entry.promotedCaptureNoteId) {
      throw new BadRequestException('This entry has already been generalized to a capture note');
    }

    const note = await this.prisma.captureNote.create({
      data: { title, content: entry.reflection, tags },
    });
    await this.prisma.learningEntry.update({
      where: { id },
      data: { promotedCaptureNoteId: note.id },
    });
    return note;
  }
}
