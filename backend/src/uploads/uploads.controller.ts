import { Controller, Post, UploadedFile, UseInterceptors, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'path';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiOperation({ summary: '匯入 Excel 進度表' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        label: { type: 'string', example: '2026-06 月報' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          const ts  = Date.now();
          const ext = path.extname(file.originalname) || '.xlsx';
          cb(null, `${ts}${ext}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/\.xlsx?$/i)) cb(null, true);
        else cb(new BadRequestException('只接受 .xlsx / .xls 檔案'), false);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('label') label: string,
  ) {
    if (!file) throw new BadRequestException('未收到檔案');
    // label 與 originalname 由 multer/busboy 以 UTF-8 正確解析，無需再轉換
    const finalLabel = (label ?? '').trim() || file.originalname.replace(/\.[^/.]+$/, '');
    return this.uploadsService.importExcel(file, finalLabel);
  }
}
