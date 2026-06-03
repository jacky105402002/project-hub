import { useEffect, useState, useCallback } from 'react';
import { Download, ArrowUpDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getTasks, getTasksMeta, deleteTask } from '@/api';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import type { Task, TasksMeta } from '@/types';
import { projectColor, formatDate } from '@/types';

const STATUS_BG: Record<string, string> = {
  '已完成': 'bg-green-100 text-green-800',
  '進行中': 'bg-blue-100 text-blue-800',
  '延遲':   'bg-orange-100 text-orange-800',
  '未開始': 'bg-gray-100 text-gray-600',
};

const initFilters = { projectName: '', status: '', phase: '', assignee: '', isOverdue: '', isFormal: '', dateFrom: '', dateTo: '' };

export function TasksPage() {
  const { selectedSnapshotId } = useAppStore();
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta]     = useState<TasksMeta>({ projects: [], phases: [], assignees: [] });
  const [filters, setFilters] = useState(initFilters);
  const [sortBy, setSortBy] = useState('plannedDate');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');

  // Modal 狀態
  const [modalMode, setModalMode] = useState<'create'|'edit'>('create');
  const [editTask, setEditTask]   = useState<Task | undefined>();
  const [showModal, setShowModal] = useState(false);

  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const load = useCallback(async (pg = 1) => {
    if (!selectedSnapshotId) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { snapshotId: selectedSnapshotId, page: pg, pageSize, sortBy, sortDir };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await getTasks(params as Record<string, string | number | boolean | undefined>);
      setTasks(res.data); setTotal(res.total); setPage(pg);
    } finally { setLoading(false); }
  }, [selectedSnapshotId, filters, sortBy, sortDir]);

  const refreshMeta = () => {
    if (selectedSnapshotId) getTasksMeta(selectedSnapshotId).then(setMeta);
  };

  useEffect(() => {
    if (!selectedSnapshotId) return;
    refreshMeta();
    load(1);
  }, [selectedSnapshotId]);

  useEffect(() => {
    if (selectedSnapshotId) load(1);
  }, [filters, sortBy, sortDir]);

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`確定刪除「${task.checkpointName}」？`)) return;
    await deleteTask(task.id);
    load(page);
  };

  const openCreate = () => { setModalMode('create'); setEditTask(undefined); setShowModal(true); };
  const openEdit   = (t: Task) => { setModalMode('edit'); setEditTask(t); setShowModal(true); };
  const onSaved    = () => { setShowModal(false); load(page); refreshMeta(); };

  const exportCSV = () => {
    const headers = ['查核點/工作事項','專案名稱','是否正式查核點','階段','預計完成日','狀態','負責人','實際完成日','是否逾期','備註'];
    const rows = tasks.map(t => [
      t.checkpointName, t.projectName, t.isFormalCheckpoint ? '是' : '否',
      t.phase ?? '', t.plannedDate?.slice(0,10) ?? '', t.status,
      t.assignees.join('、'), t.actualDate?.slice(0,10) ?? '',
      t.isOverdue ? '是' : '否', (t.remarks ?? '').replace(/[\n\r]/g, ' '),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: '專案進度匯出.csv' });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const SortBtn = ({ col }: { col: string }) => (
    <button onClick={() => handleSort(col)} className="hover:text-gray-700">
      <ArrowUpDown className="w-3 h-3 inline ml-1" />
      {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </button>
  );

  return (
    <div>
      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { key: 'projectName', label: '全部專案',  options: meta.projects },
            { key: 'status',      label: '全部狀態',  options: ['已完成','進行中','延遲','未開始'] },
            { key: 'phase',       label: '全部階段',  options: meta.phases },
            { key: 'assignee',    label: '全部負責人', options: meta.assignees },
          ].map(({ key, label, options }) => (
            <select key={key} className="border border-gray-200 rounded-lg px-3 py-2 text-[14px]"
              value={(filters as Record<string,string>)[key]}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}>
              <option value="">{label}</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-[14px]" value={filters.isOverdue} onChange={e => setFilters(f => ({ ...f, isOverdue: e.target.value }))}>
            <option value="">逾期篩選</option>
            <option value="true">僅逾期</option>
            <option value="false">未逾期</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-[14px]" value={filters.isFormal} onChange={e => setFilters(f => ({ ...f, isFormal: e.target.value }))}>
            <option value="">全部任務</option>
            <option value="true">正式查核點</option>
            <option value="false">非正式</option>
          </select>
          <button onClick={() => setFilters(initFilters)} className="border border-gray-200 text-gray-500 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">清除篩選</button>
        </div>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">從</label>
              <input type="date" className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">至</label>
              <input type="date" className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">共 {total} 筆</span>
            <button onClick={exportCSV} className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> 匯出 CSV
            </button>
            <button onClick={openCreate} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> 新增任務
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="py-10 text-center text-gray-400">載入中…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left min-w-[200px]">查核點/工作事項 <SortBtn col="checkpointName" /></th>
                  <th className="px-4 py-3 text-left w-36">專案 <SortBtn col="projectName" /></th>
                  <th className="px-4 py-3 text-left w-20">階段</th>
                  <th className="px-4 py-3 text-left w-28">預計完成 <SortBtn col="plannedDate" /></th>
                  <th className="px-4 py-3 text-center w-24">狀態 <SortBtn col="status" /></th>
                  <th className="px-4 py-3 text-left w-32">負責人</th>
                  <th className="px-4 py-3 text-left w-24">實際完成</th>
                  <th className="px-4 py-3 text-center w-10">逾期</th>
                  <th className="px-4 py-3 w-8">備註</th>
                  <th className="px-4 py-3 text-center w-20">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-10 text-gray-400">無符合條件的任務</td></tr>
                ) : tasks.map(t => (
                  <tr key={t.id} className={`transition-colors ${t.isOverdue ? 'bg-red-50 hover:bg-red-100' : t.status === '延遲' ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-1.5">
                        {t.isFormalCheckpoint && <div className="w-2 h-2 mt-1 bg-blue-500 rounded-full shrink-0" title="正式查核點" />}
                        <span className="text-gray-800">{t.checkpointName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: projectColor(t.projectName) }} />
                        <span className="text-sm text-gray-600 truncate max-w-[130px]">{t.projectName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.phase ?? '—'}</td>
                    <td className={`px-4 py-3 text-xs ${t.isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{formatDate(t.plannedDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${STATUS_BG[t.status] ?? 'bg-gray-100 text-gray-400'}`}>{t.status || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.assignees.map(a => <span key={a} className="inline-block bg-gray-100 text-gray-700 text-sm px-2 py-0.5 rounded-full">{a}</span>)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.actualDate)}</td>
                    <td className="px-4 py-3 text-center">{t.isOverdue && <span className="text-red-500" title="逾期">⚠</span>}</td>
                    <td className="px-4 py-3">
                      {t.remarks && (
                        <div className="relative group cursor-help">
                          <span className="text-gray-400 hover:text-gray-600 text-base">ℹ</span>
                          <div className="absolute right-0 top-6 z-50 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-64 whitespace-pre-wrap shadow-lg">{t.remarks}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-center">
                        <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-blue-600 transition-colors" title="編輯">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(t)} className="text-gray-400 hover:text-red-600 transition-colors" title="刪除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button onClick={() => load(page - 1)} disabled={page === 1} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">上一頁</button>
            <span className="text-sm text-gray-500">第 {page} / {totalPages} 頁</span>
            <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">下一頁</button>
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {showModal && selectedSnapshotId && (
        <TaskFormModal
          mode={modalMode}
          task={editTask}
          snapshotId={selectedSnapshotId}
          projects={meta.projects}
          phases={meta.phases}
          onClose={() => setShowModal(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
