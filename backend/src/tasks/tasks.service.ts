import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private async latestSnapshotId(): Promise<number | null> {
    const s = await this.prisma.snapshot.findFirst({ orderBy: { importedAt: 'desc' }, select: { id: true } });
    return s?.id ?? null;
  }

  private parseDate(d?: string): Date | null {
    if (!d) return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  async findAll(dto: QueryTasksDto) {
    const snapshotId = dto.snapshotId ?? await this.latestSnapshotId();
    if (!snapshotId) return { total: 0, page: 1, pageSize: dto.pageSize ?? 50, data: [] };

    const where: Prisma.TaskWhereInput = { snapshotId };
    if (dto.projectName) where.projectName = dto.projectName;
    if (dto.status)      where.status = dto.status;
    if (dto.phase)       where.phase = dto.phase;
    if (dto.isOverdue !== undefined) where.isOverdue = dto.isOverdue;
    if (dto.isFormal !== undefined)  where.isFormalCheckpoint = dto.isFormal;
    if (dto.assignee)    where.assignees = { has: dto.assignee };
    if (dto.dateFrom || dto.dateTo) {
      where.plannedDate = {};
      if (dto.dateFrom) (where.plannedDate as any).gte = new Date(dto.dateFrom);
      if (dto.dateTo)   (where.plannedDate as any).lte = new Date(dto.dateTo + 'T23:59:59');
    }

    const VALID_SORT: Record<string, string> = {
      plannedDate: 'plannedDate', status: 'status',
      projectName: 'projectName', actualDate: 'actualDate', checkpointName: 'checkpointName',
    };
    const orderBy: Prisma.TaskOrderByWithRelationInput = {
      [(VALID_SORT[dto.sortBy ?? ''] ?? 'plannedDate')]: dto.sortDir ?? 'asc',
    };

    const page     = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 50;

    const [total, data] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    ]);

    return { total, page, pageSize, data };
  }

  async getMeta(snapshotId?: number) {
    const sid = snapshotId ?? await this.latestSnapshotId();
    if (!sid) return { projects: [], phases: [], assignees: [] };

    const [projects, phases, assigneeRows] = await Promise.all([
      this.prisma.task.findMany({ where: { snapshotId: sid }, select: { projectName: true }, distinct: ['projectName'], orderBy: { projectName: 'asc' } }),
      this.prisma.task.findMany({ where: { snapshotId: sid, phase: { not: null } }, select: { phase: true }, distinct: ['phase'], orderBy: { phase: 'asc' } }),
      this.prisma.task.findMany({ where: { snapshotId: sid }, select: { assignees: true } }),
    ]);

    const assigneeSet = new Set<string>();
    assigneeRows.forEach(r => r.assignees.forEach(a => { if (a) assigneeSet.add(a); }));

    return {
      projects: projects.map(r => r.projectName),
      phases:   phases.map(r => r.phase!),
      assignees: [...assigneeSet].sort(),
    };
  }

  async create(dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        snapshotId:         dto.snapshotId,
        checkpointName:     dto.checkpointName,
        projectName:        dto.projectName,
        isFormalCheckpoint: dto.isFormalCheckpoint ?? false,
        phase:              dto.phase ?? null,
        plannedDate:        this.parseDate(dto.plannedDate),
        status:             dto.status ?? '未開始',
        assignees:          dto.assignees ?? [],
        actualDate:         this.parseDate(dto.actualDate),
        remarks:            dto.remarks ?? null,
        isOverdue:          dto.isOverdue ?? false,
      },
    });
  }

  async update(id: number, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`任務 #${id} 不存在`);

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.checkpointName     !== undefined && { checkpointName: dto.checkpointName }),
        ...(dto.projectName        !== undefined && { projectName: dto.projectName }),
        ...(dto.isFormalCheckpoint !== undefined && { isFormalCheckpoint: dto.isFormalCheckpoint }),
        ...(dto.phase              !== undefined && { phase: dto.phase || null }),
        ...(dto.plannedDate        !== undefined && { plannedDate: this.parseDate(dto.plannedDate) }),
        ...(dto.status             !== undefined && { status: dto.status }),
        ...(dto.assignees          !== undefined && { assignees: dto.assignees }),
        ...(dto.actualDate         !== undefined && { actualDate: this.parseDate(dto.actualDate) }),
        ...(dto.remarks            !== undefined && { remarks: dto.remarks || null }),
        ...(dto.isOverdue          !== undefined && { isOverdue: dto.isOverdue }),
      },
    });
  }

  async remove(id: number) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`任務 #${id} 不存在`);
    await this.prisma.task.delete({ where: { id } });
    return { success: true };
  }
}
