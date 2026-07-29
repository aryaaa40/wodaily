import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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

  describe('update', () => {
    it('throws NotFoundException when the entry does not exist', async () => {
      prisma.learningEntry.findUnique.mockResolvedValue(null);

      await expect(service.update('missing-id', { attemptLog: 'tried X' })).rejects.toThrow(NotFoundException);
    });

    it('rejects setting researchNotes before an attemptLog exists', async () => {
      prisma.learningEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        attemptLog: null,
        reflection: null,
        status: 'PROBLEM',
      });

      await expect(
        service.update('entry-1', { researchNotes: 'found an article' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.learningEntry.update).not.toHaveBeenCalled();
    });

    it('allows setting researchNotes in the same call that sets attemptLog', async () => {
      prisma.learningEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        attemptLog: null,
        reflection: null,
        status: 'PROBLEM',
      });
      prisma.learningEntry.update.mockResolvedValue({ id: 'entry-1' });

      await service.update('entry-1', { attemptLog: 'tried X', researchNotes: 'found an article' });

      expect(prisma.learningEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { attemptLog: 'tried X', researchNotes: 'found an article' },
      });
    });

    it('rejects moving to ATTEMPT without an attemptLog', async () => {
      prisma.learningEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        attemptLog: null,
        reflection: null,
        status: 'PROBLEM',
      });

      await expect(
        service.update('entry-1', { status: 'ATTEMPT' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows moving to ATTEMPT when attemptLog already exists', async () => {
      prisma.learningEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        attemptLog: 'tried X',
        reflection: null,
        status: 'PROBLEM',
      });
      prisma.learningEntry.update.mockResolvedValue({ id: 'entry-1', status: 'ATTEMPT' });

      await service.update('entry-1', { status: 'ATTEMPT' as any });

      expect(prisma.learningEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { status: 'ATTEMPT' },
      });
    });

    it('rejects moving to LEARNED without a reflection', async () => {
      prisma.learningEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        attemptLog: 'tried X',
        reflection: null,
        status: 'ATTEMPT',
      });

      await expect(
        service.update('entry-1', { status: 'LEARNED' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows moving to LEARNED when reflection is provided in the same call', async () => {
      prisma.learningEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        attemptLog: 'tried X',
        reflection: null,
        status: 'ATTEMPT',
      });
      prisma.learningEntry.update.mockResolvedValue({ id: 'entry-1', status: 'LEARNED' });

      await service.update('entry-1', { reflection: 'now I understand X', status: 'LEARNED' as any });

      expect(prisma.learningEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { reflection: 'now I understand X', status: 'LEARNED' },
      });
    });
  });
});
