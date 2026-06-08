import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExcelParserService } from './excel-parser.service';

@Injectable()
export class UploadsService {
  constructor(
    private prisma: PrismaService,
    private parser: ExcelParserService,
  ) {}

  async importExcel(file: Express.Multer.File, label: string) {
    const tasks = this.parser.parse(file.path);

    const snapshot = await this.prisma.snapshot.create({
      data: {
        filename: file.originalname,
        label: label || file.originalname.replace(/\.[^/.]+$/, ''),
        filePath: file.path,
        rowCount: tasks.length,
        tasks: {
          create: tasks.map(t => ({
            checkpointName: t.checkpointName,
            projectName: t.projectName,
            isFormalCheckpoint: t.isFormalCheckpoint,
            phase: t.phase,
            plannedDate: t.plannedDate,
            status: t.status,
            assignees: t.assignees,
            actualDate: t.actualDate,
            remarks: t.remarks,
            isOverdue: t.isOverdue,
          })),
        },
      },
    });

    return { snapshotId: snapshot.id, rowCount: snapshot.rowCount };
  }
}
