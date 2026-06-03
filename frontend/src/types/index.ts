export interface Snapshot {
  id: number;
  filename: string;
  label: string;
  rowCount: number;
  importedAt: string;
}

export interface Task {
  id: number;
  snapshotId: number;
  checkpointName: string;
  projectName: string;
  isFormalCheckpoint: boolean;
  phase: string | null;
  plannedDate: string | null;
  status: string;
  assignees: string[];
  actualDate: string | null;
  remarks: string | null;
  isOverdue: boolean;
  createdAt: string;
}

export interface TasksResponse {
  total: number;
  page: number;
  pageSize: number;
  data: Task[];
}

export interface TasksMeta {
  projects: string[];
  phases: string[];
  assignees: string[];
}

export interface DashboardSummary {
  snapshotId: number;
  total: number;
  completed: number;
  inProgress: number;
  delayed: number;
  notStarted: number;
  overdueCount: number;
  completionRate: number;
}

export interface ProjectStat {
  projectName: string;
  total: number;
  completed: number;
  inProgress: number;
  delayed: number;
  notStarted: number;
  overdueCount: number;
  completionRate: number;
}

export interface PhaseStat {
  phase: string;
  total: number;
  completed: number;
  inProgress: number;
  delayed: number;
  notStarted: number;
}

export interface AssigneeStat {
  assignee: string;
  total: number;
  completed: number;
  inProgress: number;
  delayed: number;
  notStarted: number;
}

export interface AlertsResponse {
  overdue: Task[];
  dueSoon: Task[];
}

export interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  project: string;
  phase: string | null;
  status: string;
  custom_class: string;
}

export type TabId = 'dashboard' | 'tasks' | 'gantt' | 'alerts';

export const STATUS_COLORS: Record<string, string> = {
  '已完成': '#10B981',
  '進行中': '#3B82F6',
  '延遲':   '#F97316',
  '未開始': '#9CA3AF',
};

export const PROJECT_PALETTE = [
  '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
  '#06B6D4','#EC4899','#84CC16','#F97316','#6366F1',
  '#14B8A6','#F43F5E','#A855F7','#0EA5E9',
];

const colorCache: Record<string, string> = {};
export function projectColor(name: string): string {
  if (!colorCache[name]) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xFFFFFF;
    colorCache[name] = PROJECT_PALETTE[Math.abs(hash) % PROJECT_PALETTE.length];
  }
  return colorCache[name];
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return d.slice(0, 10).replace(/-/g, '/');
}

export function diffDays(from: string, to: string): number {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}
