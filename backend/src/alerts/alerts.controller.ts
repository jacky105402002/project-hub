import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: '逾期 + 7 天內到期任務（支援篩選與分頁）' })
  getAlerts(
    @Query('snapshotId',   new ParseIntPipe({ optional: true })) snapshotId?: number,
    @Query('overdueSkip',  new ParseIntPipe({ optional: true })) overdueSkip?: number,
    @Query('dueSoonSkip',  new ParseIntPipe({ optional: true })) dueSoonSkip?: number,
    @Query('projectName') projectName?: string,
    @Query('status')      status?: string,
  ) {
    return this.alertsService.getAlerts({ snapshotId, projectName, status, overdueSkip, dueSoonSkip });
  }
}
