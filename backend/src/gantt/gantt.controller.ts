import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GanttService } from './gantt.service';

@ApiTags('gantt')
@Controller('gantt')
export class GanttController {
  constructor(private readonly ganttService: GanttService) {}

  @Get()
  @ApiOperation({ summary: 'Frappe Gantt 格式任務資料' })
  getGanttData(
    @Query('snapshotId', new ParseIntPipe({ optional: true })) sid?: number,
    @Query('projectName') projectName?: string,
    @Query('phase') phase?: string,
  ) {
    return this.ganttService.getGanttData(sid, projectName, phase);
  }
}
