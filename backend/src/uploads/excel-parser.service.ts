import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface ParsedTask {
  checkpointName: string;
  projectName: string;
  isFormalCheckpoint: boolean;
  phase: string | null;
  plannedDate: Date | null;
  status: string;
  assignees: string[];
  actualDate: Date | null;
  remarks: string | null;
  isOverdue: boolean;
}

const REQUIRED_HEADERS = ['查核點/工作事項', '專案名稱'];

@Injectable()
export class ExcelParserService {
  parse(filePath: string): ParsedTask[] {
    const wb = XLSX.readFile(filePath);

    const targetSheet = wb.SheetNames
      .map(name => wb.Sheets[name])
      .find(ws => {
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
        return rows[0] && REQUIRED_HEADERS.every(h => (rows[0] as string[]).includes(h));
      });

    if (!targetSheet) {
      throw new BadRequestException('找不到符合格式的工作表（需包含「查核點/工作事項」與「專案名稱」欄）');
    }

    const rows = XLSX.utils.sheet_to_json<string[]>(targetSheet, { header: 1, defval: '' });
    const headers = rows[0] as string[];
    const col: Record<string, number> = {};
    headers.forEach((h, i) => { col[h] = i; });

    const tasks: ParsedTask[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as any[];
      const checkpointName = String(row[col['查核點/工作事項']] ?? '').trim();
      const projectName = String(row[col['專案名稱']] ?? '').trim();
      if (!checkpointName && !projectName) continue;

      tasks.push({
        checkpointName,
        projectName,
        isFormalCheckpoint: this.parseBool(row[col['是否為正式查核點']]),
        phase: String(row[col['專案期程階段']] ?? '').trim() || null,
        plannedDate: this.excelDateToDate(row[col['預計完成日']]),
        status: String(row[col['目前專案進度']] ?? '').trim(),
        assignees: this.parseAssignees(row[col['負責人']]),
        actualDate: this.excelDateToDate(row[col['實際完成日']]),
        remarks: String(row[col['備註/風險說明']] ?? '').trim() || null,
        isOverdue: this.parseBool(row[col['是否逾期']]),
      });
    }

    return tasks;
  }

  private excelDateToDate(serial: unknown): Date | null {
    if (!serial || typeof serial !== 'number' || isNaN(serial)) return null;
    return new Date((serial - 25569) * 86400 * 1000);
  }

  private parseBool(val: unknown): boolean {
    return val === true || val === 1 || val === '是' || val === 'TRUE' || val === 'true';
  }

  private parseAssignees(raw: unknown): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    const str = String(raw).trim();
    if (str.startsWith('[')) {
      try { return JSON.parse(str) as string[]; } catch {}
    }
    return str.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  }
}
