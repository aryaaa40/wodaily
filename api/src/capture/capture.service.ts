import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CaptureService {
  constructor(private readonly prisma: PrismaService) {}

  create(title: string, content: string, tags: string[] = []) {
    return this.prisma.captureNote.create({ data: { title, content, tags } });
  }

  findAll(params: { tag?: string; search?: string }) {
    const conditions: Record<string, unknown>[] = [];
    if (params.tag) {
      conditions.push({ tags: { has: params.tag } });
    }
    if (params.search) {
      conditions.push({
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { content: { contains: params.search, mode: 'insensitive' } },
        ],
      });
    }
    return this.prisma.captureNote.findMany({
      where: conditions.length ? { AND: conditions } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    const note = await this.prisma.captureNote.findUnique({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Capture note ${id} not found`);
    }
    return this.prisma.captureNote.delete({ where: { id } });
  }
}
