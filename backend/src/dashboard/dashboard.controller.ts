import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: '全域統計卡片' })
  getSummary(@Query('snapshotId', new ParseIntPipe({ optional: true })) sid?: number) {
    return this.dashboardService.getSummary(sid);
  }

  @Get('by-project')
  @ApiOperation({ summary: '各專案完成率與狀態分佈' })
  getByProject(@Query('snapshotId', new ParseIntPipe({ optional: true })) sid?: number) {
    return this.dashboardService.getByProject(sid);
  }

  @Get('by-phase')
  @ApiOperation({ summary: '各階段任務數量' })
  getByPhase(@Query('snapshotId', new ParseIntPipe({ optional: true })) sid?: number) {
    return this.dashboardService.getByPhase(sid);
  }

  @Get('by-assignee')
  @ApiOperation({ summary: '各負責人任務負載' })
  getByAssignee(@Query('snapshotId', new ParseIntPipe({ optional: true })) sid?: number) {
    return this.dashboardService.getByAssignee(sid);
  }
}
