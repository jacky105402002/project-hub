import { Controller, Get, Post, Patch, Delete, Query, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: '查詢任務列表（含篩選分頁）' })
  findAll(@Query() dto: QueryTasksDto) {
    return this.tasksService.findAll(dto);
  }

  @Get('meta')
  @ApiOperation({ summary: '取得篩選選項（專案、階段、負責人清單）' })
  getMeta(@Query('snapshotId', new ParseIntPipe({ optional: true })) snapshotId?: number) {
    return this.tasksService.getMeta(snapshotId);
  }

  @Post()
  @ApiOperation({ summary: '新增任務' })
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '編輯任務' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除任務' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }
}
