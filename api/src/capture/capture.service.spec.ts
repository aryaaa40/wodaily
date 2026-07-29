import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CaptureService } from './capture.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CaptureService', () => {
  let service: CaptureService;
  let prisma: {
    captureNote: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      captureNote: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [CaptureService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CaptureService);
  });

  it('creates a note with the given title, content, and tags', async () => {
    prisma.captureNote.create.mockResolvedValue({ id: '1', title: 'T', content: 'C', tags: ['react'] });

    await service.create('T', 'C', ['react']);

    expect(prisma.captureNote.create).toHaveBeenCalledWith({
      data: { title: 'T', content: 'C', tags: ['react'] },
    });
  });

  it('filters by tag and search text together when both are given', async () => {
    prisma.captureNote.findMany.mockResolvedValue([]);

    await service.findAll({ tag: 'react', search: 'pattern' });

    expect(prisma.captureNote.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { tags: { has: 'react' } },
          {
            OR: [
              { title: { contains: 'pattern', mode: 'insensitive' } },
              { content: { contains: 'pattern', mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('throws NotFoundException when removing a missing note', async () => {
    prisma.captureNote.findUnique.mockResolvedValue(null);

    await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
  });
});
