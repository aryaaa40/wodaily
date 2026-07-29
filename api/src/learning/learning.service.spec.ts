import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LearningService } from './learning.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LearningService', () => {
  let service: LearningService;
  let prisma: {
    task: { findUnique: jest.Mock };
    learningEntry: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    captureNote: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      task: { findUnique: jest.fn() },
      learningEntry: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      captureNote: { create: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [LearningService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(LearningService);
  });

  it('creates a PROBLEM-status entry when the referenced task exists', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1' });
    prisma.learningEntry.create.mockResolvedValue({ id: 'entry-1', taskId: 'task-1', status: 'PROBLEM' });

    const result = await service.create('task-1', 'Bingung state management pattern mana yang cocok');

    expect(prisma.learningEntry.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        problemStatement: 'Bingung state management pattern mana yang cocok',
        status: 'PROBLEM',
      },
    });
    expect(result.status).toBe('PROBLEM');
  });

  it('refuses to create an entry when the task does not exist', async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    await expect(service.create('missing-task', 'Something')).rejects.toThrow(NotFoundException);
    expect(prisma.learningEntry.create).not.toHaveBeenCalled();
  });

  it('filters findAll by taskId when provided', async () => {
    prisma.learningEntry.findMany.mockResolvedValue([]);

    await service.findAll('task-1');

    expect(prisma.learningEntry.findMany).toHaveBeenCalledWith({
      where: { taskId: 'task-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('lists all entries when no taskId is provided', async () => {
    prisma.learningEntry.findMany.mockResolvedValue([]);

    await service.findAll();

    expect(prisma.learningEntry.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
    });
  });
});
