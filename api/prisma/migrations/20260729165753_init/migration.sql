-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "LearningEntryStatus" AS ENUM ('PROBLEM', 'ATTEMPT', 'LEARNED');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptureNote" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaptureNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEntry" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" "LearningEntryStatus" NOT NULL DEFAULT 'PROBLEM',
    "problemStatement" TEXT NOT NULL,
    "attemptLog" TEXT,
    "researchNotes" TEXT,
    "reflection" TEXT,
    "promotedCaptureNoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningEntry_promotedCaptureNoteId_key" ON "LearningEntry"("promotedCaptureNoteId");

-- AddForeignKey
ALTER TABLE "LearningEntry" ADD CONSTRAINT "LearningEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEntry" ADD CONSTRAINT "LearningEntry_promotedCaptureNoteId_fkey" FOREIGN KEY ("promotedCaptureNoteId") REFERENCES "CaptureNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
