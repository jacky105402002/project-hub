import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private async latestSnapshotId(sid?: number): Promise<number | null> {
    if (sid) return sid;
    const s = await this.prisma.snapshot.findFirst({ orderBy: { importedAt: 'desc' }, select: { id: true } });
    return s?.id ?? null;
  }

  async getSummary(snapshotId?: number) {
    const sid = await this.latestSnapshotId(snapshotId);
    if (!sid) return null;

    const tasks = await this.prisma.task.findMany({
      where: { snapshotId: sid },
      select: { status: true, isOverdue: true },
    });

    const total      = tasks.length;
    const completed  = tasks.filter(t => t.status === '已完成').length;
    const inProgress = tasks.filter(t => t.status === '進行中').length;
    const delayed    = tasks.filter(t => t.status === '延遲').length;
    const notStarted = tasks.filter(t => t.status === '未開始').length;
    const overdue    = tasks.filter(t => t.isOverdue).length;

    return {
      snapshotId: sid, total, completed,
      inProgress, delayed, notStarted,
      overdueCount: overdue,
      completionRate: total > 0 ? completed / total : 0,
    };
  }

  async getByProject(snapshotId?: number) {
    const sid = await this.latestSnapshotId(snapshotId);
    if (!sid) return [];

    const tasks = await this.prisma.task.findMany({
      where: { snapshotId: sid },
      select: { projectName: true, status: true, isOverdue: true },
    });

    const map: Record<string, { total: number; completed: number; inProgress: number; delayed: number; notStarted: number; overdueCount: number }> = {};
    for (const t of tasks) {
      if (!map[t.projectName]) map[t.projectName] = { total: 0, completed: 0, inProgress: 0, delayed: 0, notStarted: 0, overdueCount: 0 };
      const p = map[t.projectName];
      p.total++;
      if (t.status === '已完成') p.completed++;
      else if (t.status === '進行中') p.inProgress++;
      else if (t.status === '延遲') p.delayed++;
      else p.notStarted++;
      if (t.isOverdue) p.overdueCount++;
    }

    return Object.entries(map)
      .map(([projectName, stats]) => ({
        projectName,
        ...stats,
        completionRate: stats.total > 0 ? stats.completed / stats.total : 0,
      }))
      .sort((a, b) => a.projectName.localeCompare(b.projectName));
  }

  async getByPhase(snapshotId?: number) {
    const sid = await this.latestSnapshotId(snapshotId);
    if (!sid) return [];

    const tasks = await this.prisma.task.findMany({
      where: { snapshotId: sid },
      select: { phase: true, status: true },
    });

    const map: Record<string, { total: number; completed: number; inProgress: number; delayed: number; notStarted: number }> = {};
    for (const t of tasks) {
      const key = t.phase ?? '（未分類）';
      if (!map[key]) map[key] = { total: 0, completed: 0, inProgress: 0, delayed: 0, notStarted: 0 };
      const p = map[key];
      p.total++;
      if (t.status === '已完成') p.completed++;
      else if (t.status === '進行中') p.inProgress++;
      else if (t.status === '延遲') p.delayed++;
      else p.notStarted++;
    }

    return Object.entries(map)
      .map(([phase, stats]) => ({ phase, ...stats }))
      .sort((a, b) => b.total - a.total);
  }

  async getByAssignee(snapshotId?: number) {
    const sid = await this.latestSnapshotId(snapshotId);
    if (!sid) return [];

    const tasks = await this.prisma.task.findMany({
      where: { snapshotId: sid },
      select: { assignees: true, status: true },
    });

    const map: Record<string, { total: number; completed: number; inProgress: number; delayed: number; notStarted: number }> = {};
    for (const t of tasks) {
      for (const person of t.assignees) {
        if (!person) continue;
        if (!map[person]) map[person] = { total: 0, completed: 0, inProgress: 0, delayed: 0, notStarted: 0 };
        const p = map[person];
        p.total++;
        if (t.status === '已完成') p.completed++;
        else if (t.status === '進行中') p.inProgress++;
        else if (t.status === '延遲') p.delayed++;
        else p.notStarted++;
      }
    }

    return Object.entries(map)
      .map(([assignee, stats]) => ({ assignee, ...stats }))
      .sort((a, b) => b.total - a.total);
  }
}
