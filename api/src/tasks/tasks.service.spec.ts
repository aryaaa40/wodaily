import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      aggregate: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TasksService);
  });

  it('creates a task positioned after the current max in TODO', async () => {
    prisma.task.aggregate.mockResolvedValue({ _max: { position: 2 } });
    prisma.task.create.mockResolvedValue({ id: '1', title: 'Test', status: 'TODO', position: 3 });

    const result = await service.create('Test');

    expect(prisma.task.create).toHaveBeenCalledWith({
      data: { title: 'Test', description: undefined, status: 'TODO', position: 3 },
    });
    expect(result.position).toBe(3);
  });

  it('starts position at 0 when the TODO column is empty', async () => {
    prisma.task.aggregate.mockResolvedValue({ _max: { position: null } });
    prisma.task.create.mockResolvedValue({ id: '1', title: 'First', status: 'TODO', position: 0 });

    await service.create('First');

    expect(prisma.task.create).toHaveBeenCalledWith({
      data: { title: 'First', description: undefined, status: 'TODO', position: 0 },
    });
  });

  it('throws NotFoundException when updating status of a missing task', async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    await expect(service.updateStatus('missing-id', 'DONE' as any, 0)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when removing a missing task', async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
  });
});
