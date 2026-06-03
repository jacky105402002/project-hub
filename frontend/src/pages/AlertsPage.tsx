import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getAlerts, getTasksMeta, type AlertsResult } from '@/api';
import type { Task, TasksMeta } from '@/types';
import { formatDate } from '@/types';

const PAGE = 10;

function diffDays(from: string, to: string) {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

function AlertCard({ task, type }: { task: Task; type: 'overdue' | 'soon' }) {
  const today = new Date().toISOString().split('T')[0];
  const days  = type === 'overdue' ? diffDays(task.plannedDate!, today) : diffDays(today, task.plannedDate!);
  return (
    <div className={`rounded-xl p-4 shadow-sm text-white ${type === 'overdue' ? 'bg-red-600' : 'bg-orange-500'}`}>
      <p className="font-medium text-sm mb-1.5 leading-snug">{task.checkpointName}</p>
      <p className="text-xs opacity-80 mb-1">📁 {task.projectName}</p>
      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="text-xs opacity-70">預計完成</p>
          <p className="text-sm font-semibold">{formatDate(task.plannedDate)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-70">{type === 'overdue' ? '逾期天數' : '剩餘天數'}</p>
          <p className="text-xl font-bold">{days} 天</p>
        </div>
      </div>
      {task.status && (
        <p className="text-xs opacity-80 mt-1">狀態：{task.status}</p>
      )}
      {task.assignees.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.assignees.map(a => <span key={a} className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{a}</span>)}
        </div>
      )}
    </div>
  );
}

export function AlertsPage() {
  const { selectedSnapshotId } = useAppStore();
  const [data, setData]       = useState<AlertsResult>({ overdue: [], overdueTotal: 0, dueSoon: [], dueSoonTotal: 0 });
  const [meta, setMeta]       = useState<TasksMeta>({ projects: [], phases: [], assignees: [] });
  const [loading, setLoading] = useState(true);

  // 篩選
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');

  // 各區塊載入更多（累積顯示的筆數）
  const [overdueShown,  setOverdueShown]  = useState(PAGE);
  const [dueSoonShown,  setDueSoonShown]  = useState(PAGE);

  // 累積的任務清單
  const [overdueList,  setOverdueList]  = useState<Task[]>([]);
  const [dueSoonList,  setDueSoonList]  = useState<Task[]>([]);

  const load = useCallback(async (reset = false) => {
    if (!selectedSnapshotId) return;
    setLoading(true);
    try {
      const res = await getAlerts({
        snapshotId: selectedSnapshotId,
        projectName: projectFilter || undefined,
        status:      statusFilter  || undefined,
        overdueSkip:  0,
        dueSoonSkip:  0,
      });
      setData(res);
      setOverdueList(res.overdue);
      setDueSoonList(res.dueSoon);
      if (reset) { setOverdueShown(PAGE); setDueSoonShown(PAGE); }
    } finally { setLoading(false); }
  }, [selectedSnapshotId, projectFilter, statusFilter]);

  useEffect(() => {
    if (!selectedSnapshotId) return;
    getTasksMeta(selectedSnapshotId).then(setMeta);
    load(true);
  }, [selectedSnapshotId, projectFilter, statusFilter]);

  // 載入更多逾期
  const loadMoreOverdue = async () => {
    if (!selectedSnapshotId) return;
    const res = await getAlerts({
      snapshotId: selectedSnapshotId,
      projectName: projectFilter || undefined,
      status:      statusFilter  || undefined,
      overdueSkip: overdueList.length,
    });
    setOverdueList(prev => [...prev, ...res.overdue]);
    setOverdueShown(s => s + PAGE);
  };

  // 載入更多即將到期
  const loadMoreDueSoon = async () => {
    if (!selectedSnapshotId) return;
    const res = await getAlerts({
      snapshotId: selectedSnapshotId,
      projectName: projectFilter || undefined,
      status:      statusFilter  || undefined,
      dueSoonSkip: dueSoonList.length,
    });
    setDueSoonList(prev => [...prev, ...res.dueSoon]);
    setDueSoonShown(s => s + PAGE);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">載入中…</div>;

  const hasAlerts = data.overdueTotal > 0 || data.dueSoonTotal > 0;

  return (
    <div>
      {/* 篩選列 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 flex gap-3 items-center flex-wrap">
        <select
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          value={projectFilter}
          onChange={e => { setProjectFilter(e.target.value); }}
        >
          <option value="">全部專案</option>
          {meta.projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); }}
        >
          <option value="">全部狀態</option>
          <option value="進行中">進行中</option>
          <option value="延遲">延遲</option>
          <option value="未開始">未開始</option>
        </select>
        {(projectFilter || statusFilter) && (
          <button onClick={() => { setProjectFilter(''); setStatusFilter(''); }} className="text-xs text-gray-500 hover:text-gray-700 underline">清除篩選</button>
        )}
        <div className="ml-auto text-xs text-gray-400">
          逾期 {data.overdueTotal} 筆 · 即將到期 {data.dueSoonTotal} 筆
        </div>
      </div>

      {/* 彙整 Banner */}
      {hasAlerts ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertTriangle className="text-red-500 w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">共 {data.overdueTotal} 筆逾期、{data.dueSoonTotal} 筆即將到期（7天內）</p>
            <p className="text-xs text-red-600 mt-0.5">請儘速確認並更新任務狀態</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-gray-500">目前無逾期或即將到期的任務</p>
        </div>
      )}

      {/* 逾期任務 */}
      {data.overdueTotal > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            逾期任務
            <span className="text-xs font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{data.overdueTotal} 筆</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {overdueList.map(t => <AlertCard key={t.id} task={t} type="overdue" />)}
          </div>
          {overdueList.length < data.overdueTotal && (
            <div className="mt-4 text-center">
              <button
                onClick={loadMoreOverdue}
                className="px-6 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
              >
                顯示更多（已顯示 {overdueList.length} / {data.overdueTotal} 筆）
              </button>
            </div>
          )}
        </div>
      )}

      {/* 即將到期 */}
      {data.dueSoonTotal > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full" />
            即將到期（7 天內）
            <span className="text-xs font-normal bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{data.dueSoonTotal} 筆</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {dueSoonList.map(t => <AlertCard key={t.id} task={t} type="soon" />)}
          </div>
          {dueSoonList.length < data.dueSoonTotal && (
            <div className="mt-4 text-center">
              <button
                onClick={loadMoreDueSoon}
                className="px-6 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200 transition-colors"
              >
                顯示更多（已顯示 {dueSoonList.length} / {data.dueSoonTotal} 筆）
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
