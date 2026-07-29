import { Injectable, NotFoundException } from '@nestjs/common';
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
}
