-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'READY', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'RUNNING', 'REVIEW', 'DONE', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "SandboxStatus" AS ENUM ('READY', 'RUNNING', 'STOPPED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "repoUrl" TEXT,
    "repoName" TEXT,
    "techStack" TEXT NOT NULL DEFAULT 'tanstack-start',
    "theme" TEXT NOT NULL DEFAULT 'slate',
    "vibeInput" TEXT,
    "specContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prUrl" TEXT,
    "prNumber" INTEGER,
    "logs" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sandbox" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "daytonaId" TEXT NOT NULL,
    "status" "SandboxStatus" NOT NULL DEFAULT 'READY',
    "taskId" TEXT,
    "snapshotId" TEXT,
    "publicUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sandbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_projectId_phase_order_idx" ON "Task"("projectId", "phase", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Sandbox_daytonaId_key" ON "Sandbox"("daytonaId");

-- CreateIndex
CREATE UNIQUE INDEX "Sandbox_taskId_key" ON "Sandbox"("taskId");

-- CreateIndex
CREATE INDEX "Sandbox_projectId_idx" ON "Sandbox"("projectId");

-- CreateIndex
CREATE INDEX "Sandbox_status_idx" ON "Sandbox"("status");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sandbox" ADD CONSTRAINT "Sandbox_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sandbox" ADD CONSTRAINT "Sandbox_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
