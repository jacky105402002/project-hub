import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsBoolean, IsInt, IsIn, Min, Max } from 'class-validator';

export class QueryTasksDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() snapshotId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() projectName?: string;
  @ApiPropertyOptional({ enum: ['已完成','進行中','延遲','未開始'] })
  @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phase?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignee?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() isOverdue?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() isFormal?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateTo?: string;
  @ApiPropertyOptional({ enum: ['plannedDate','status','projectName','actualDate','checkpointName'] })
  @IsOptional() @IsString() sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc','desc'] })
  @IsOptional() @IsIn(['asc','desc']) sortDir?: 'asc' | 'desc';
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) pageSize?: number = 50;
}
