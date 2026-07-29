import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(title: string, description?: string) {
    const maxPosition = await this.prisma.task.aggregate({
      where: { status: TaskStatus.TODO },
      _max: { position: true },
    });
    return this.prisma.task.create({
      data: {
        title,
        description,
        status: TaskStatus.TODO,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });
  }

  findAll() {
    return this.prisma.task.findMany({ orderBy: [{ status: 'asc' }, { position: 'asc' }] });
  }

  async updateStatus(id: string, status: TaskStatus, position: number) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return this.prisma.task.update({ where: { id }, data: { status, position } });
  }

  async remove(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return this.prisma.task.delete({ where: { id } });
  }
}
