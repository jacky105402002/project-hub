import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SnapshotsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.snapshot.findMany({
      select: { id: true, filename: true, label: true, rowCount: true, importedAt: true },
      orderBy: { importedAt: 'desc' },
    });
  }

  async remove(id: number) {
    const snapshot = await this.prisma.snapshot.findUnique({ where: { id } });
    if (!snapshot) throw new NotFoundException(`快照 #${id} 不存在`);
    await this.prisma.snapshot.delete({ where: { id } });
    return { success: true };
  }
}
