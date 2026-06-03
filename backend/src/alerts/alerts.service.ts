import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 10;

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  private async latestSnapshotId(sid?: number): Promise<number | null> {
    if (sid) return sid;
    const s = await this.prisma.snapshot.findFirst({ orderBy: { importedAt: 'desc' }, select: { id: true } });
    return s?.id ?? null;
  }

  async getAlerts(params: {
    snapshotId?: number;
    projectName?: string;
    status?: string;
    overdueSkip?: number;
    dueSoonSkip?: number;
  }) {
    const sid = await this.latestSnapshotId(params.snapshotId);
    if (!sid) return { overdue: [], dueSoon: [], overdueTotal: 0, dueSoonTotal: 0 };

    const now   = new Date();
    const in7d  = new Date(now.getTime() + 7 * 86400 * 1000);

    const commonWhere: Prisma.TaskWhereInput = {
      snapshotId: sid,
      ...(params.projectName ? { projectName: params.projectName } : {}),
      ...(params.status      ? { status: params.status }           : { status: { not: '已完成' } }),
    };

    const overdueWhere:  Prisma.TaskWhereInput = { ...commonWhere, plannedDate: { lt: now } };
    const dueSoonWhere:  Prisma.TaskWhereInput = { ...commonWhere, plannedDate: { gte: now, lte: in7d } };

    const overdueSkip  = params.overdueSkip  ?? 0;
    const dueSoonSkip  = params.dueSoonSkip  ?? 0;

    const [overdue, overdueTotal, dueSoon, dueSoonTotal] = await Promise.all([
      this.prisma.task.findMany({ where: overdueWhere,  orderBy: { plannedDate: 'asc' }, skip: overdueSkip,  take: PAGE_SIZE }),
      this.prisma.task.count({   where: overdueWhere }),
      this.prisma.task.findMany({ where: dueSoonWhere,  orderBy: { plannedDate: 'asc' }, skip: dueSoonSkip,  take: PAGE_SIZE }),
      this.prisma.task.count({   where: dueSoonWhere }),
    ]);

    return { overdue, overdueTotal, dueSoon, dueSoonTotal };
  }
}
