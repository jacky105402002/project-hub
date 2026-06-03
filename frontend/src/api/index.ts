import { apiFetch, apiUpload } from './client';
import type {
  Snapshot, TasksResponse, TasksMeta, DashboardSummary,
  ProjectStat, PhaseStat, AssigneeStat, GanttTask, Task,
} from '@/types';

// Snapshots
export const getSnapshots    = () => apiFetch<Snapshot[]>('/snapshots');
export const deleteSnapshot  = (id: number) => apiFetch<{ success: boolean }>(`/snapshots/${id}`, { method: 'DELETE' });

// Uploads
export const uploadExcel = (file: File, label: string) => {
  const form = new FormData();
  form.append('file', file);
  form.append('label', label);
  return apiUpload<{ snapshotId: number; rowCount: number }>('/uploads', form);
};

// Tasks
export const getTasks = (params: Record<string, string | number | boolean | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)); });
  return apiFetch<TasksResponse>(`/tasks?${q}`);
};
export const getTasksMeta = (snapshotId?: number) =>
  apiFetch<TasksMeta>(`/tasks/meta${snapshotId ? `?snapshotId=${snapshotId}` : ''}`);

export const createTask = (body: Record<string, unknown>) =>
  apiFetch<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) });

export const updateTask = (id: number, body: Record<string, unknown>) =>
  apiFetch<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const deleteTask = (id: number) =>
  apiFetch<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' });

// Dashboard
export const getDashboardSummary    = (sid?: number) => apiFetch<DashboardSummary>(`/dashboard/summary${sid ? `?snapshotId=${sid}` : ''}`);
export const getDashboardByProject  = (sid?: number) => apiFetch<ProjectStat[]>(`/dashboard/by-project${sid ? `?snapshotId=${sid}` : ''}`);
export const getDashboardByPhase    = (sid?: number) => apiFetch<PhaseStat[]>(`/dashboard/by-phase${sid ? `?snapshotId=${sid}` : ''}`);
export const getDashboardByAssignee = (sid?: number) => apiFetch<AssigneeStat[]>(`/dashboard/by-assignee${sid ? `?snapshotId=${sid}` : ''}`);

// Alerts
export interface AlertsResult {
  overdue: Task[]; overdueTotal: number;
  dueSoon: Task[]; dueSoonTotal: number;
}
export const getAlerts = (params: {
  snapshotId?: number; projectName?: string; status?: string;
  overdueSkip?: number; dueSoonSkip?: number;
}) => {
  const q = new URLSearchParams();
  if (params.snapshotId)   q.set('snapshotId',  String(params.snapshotId));
  if (params.projectName)  q.set('projectName', params.projectName);
  if (params.status)       q.set('status',      params.status);
  if (params.overdueSkip)  q.set('overdueSkip', String(params.overdueSkip));
  if (params.dueSoonSkip)  q.set('dueSoonSkip', String(params.dueSoonSkip));
  return apiFetch<AlertsResult>(`/alerts?${q}`);
};

// Gantt
export const getGantt = (params: { snapshotId?: number; projectName?: string; phase?: string }) => {
  const q = new URLSearchParams();
  if (params.snapshotId)  q.set('snapshotId',  String(params.snapshotId));
  if (params.projectName) q.set('projectName', params.projectName);
  if (params.phase)       q.set('phase',       params.phase);
  return apiFetch<GanttTask[]>(`/gantt?${q}`);
};
