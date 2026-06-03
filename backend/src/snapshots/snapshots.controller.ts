import { Controller, Get, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SnapshotsService } from './snapshots.service';

@ApiTags('snapshots')
@Controller('snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Get()
  @ApiOperation({ summary: '列出所有快照' })
  findAll() {
    return this.snapshotsService.findAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除快照（含所有任務）' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.snapshotsService.remove(id);
  }
}
