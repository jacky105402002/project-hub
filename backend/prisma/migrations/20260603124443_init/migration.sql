-- CreateTable
CREATE TABLE "snapshots" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "snapshotId" INTEGER NOT NULL,
    "checkpointName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "isFormalCheckpoint" BOOLEAN NOT NULL DEFAULT false,
    "phase" TEXT,
    "plannedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT '',
    "assignees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "actualDate" TIMESTAMP(3),
    "remarks" TEXT,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_snapshotId_idx" ON "tasks"("snapshotId");

-- CreateIndex
CREATE INDEX "tasks_projectName_idx" ON "tasks"("projectName");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_plannedDate_idx" ON "tasks"("plannedDate");

-- CreateIndex
CREATE INDEX "tasks_isOverdue_idx" ON "tasks"("isOverdue");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
