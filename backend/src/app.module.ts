import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UploadsModule } from './uploads/uploads.module';
import { SnapshotsModule } from './snapshots/snapshots.module';
import { TasksModule } from './tasks/tasks.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AlertsModule } from './alerts/alerts.module';
import { GanttModule } from './gantt/gantt.module';

@Module({
  imports: [
    PrismaModule,
    UploadsModule,
    SnapshotsModule,
    TasksModule,
    DashboardModule,
    AlertsModule,
    GanttModule,
  ],
})
export class AppModule {}
