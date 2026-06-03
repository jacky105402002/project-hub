import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty()  @IsInt()    snapshotId: number;
  @ApiProperty()  @IsString() checkpointName: string;
  @ApiProperty()  @IsString() projectName: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFormalCheckpoint?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString()  phase?: string;
  @ApiPropertyOptional({ example: '2026-06-30' }) @IsOptional() @IsString() plannedDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  status?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() assignees?: string[];
  @ApiPropertyOptional({ example: '2026-06-30' }) @IsOptional() @IsString() actualDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  remarks?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isOverdue?: boolean;
}
