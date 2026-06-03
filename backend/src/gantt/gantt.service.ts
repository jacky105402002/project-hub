import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const STATUS_CLASS: Record<string, string> = {
  '已完成': 'bar-completed',
  '進行中': 'bar-in-progress',
  '延遲':   'bar-delayed',
  '未開始': 'bar-not-started',
};

@Injectable()
export class GanttService {
  constructor(private prisma: PrismaService) {}

  private async latestSnapshotId(sid?: number): Promise<number | null> {
    if (sid) return sid;
    const s = await this.prisma.snapshot.findFirst({ orderBy: { importedAt: 'desc' }, select: { id: true } });
    return s?.id ?? null;
  }

  private toDateStr(d: Date | null): string {
    if (!d) return '';
    return d.toISOString().split('T')[0];
  }

  async getGanttData(snapshotId?: number, projectName?: string, phase?: string) {
    const sid = await this.latestSnapshotId(snapshotId);
    if (!sid) return [];

    const tasks = await this.prisma.task.findMany({
      where: {
        snapshotId: sid,
        plannedDate: { not: null },
        ...(projectName ? { projectName } : {}),
        ...(phase ? { phase } : {}),
      },
      orderBy: { plannedDate: 'asc' },
    });

    return tasks.map(t => {
      const start = this.toDateStr(t.plannedDate);
      const end   = t.status === '已完成' && t.actualDate
        ? this.toDateStr(t.actualDate)
        : start;

      return {
        id:           String(t.id),
        name:         t.checkpointName,
        start,
        end:          end >= start ? end : start,
        progress:     t.status === '已完成' ? 100 : t.status === '進行中' ? 50 : 0,
        project:      t.projectName,
        phase:        t.phase,
        status:       t.status,
        custom_class: STATUS_CLASS[t.status] ?? '',
      };
    });
  }
}
