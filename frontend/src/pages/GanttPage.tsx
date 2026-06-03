import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { getGantt, getTasksMeta } from '@/api';
import type { GanttTask, TasksMeta } from '@/types';

declare const Gantt: any;

const VIEW_MODES = [
  { key: 'Week',    label: '週' },
  { key: 'Month',   label: '月' },
  { key: 'Quarter', label: '季' },
] as const;

const STATUS_COLOR_MAP: Record<string, string> = {
  '已完成': '#10B981',
  '進行中': '#3B82F6',
  '延遲':   '#F97316',
  '未開始': '#9CA3AF',
};

function buildPopupHtml(t: any): string {
  const color = STATUS_COLOR_MAP[t.status] ?? '#9CA3AF';
  return `
    <div style="
      font-family: system-ui,'Segoe UI','Microsoft JhengHei',sans-serif;
      padding: 14px 16px;
      min-width: 250px;
      max-width: 300px;
    ">
      <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 8px;line-height:1.4">
        ${t.name}
      </p>
      <div style="display:flex;flex-direction:column;gap:5px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#6B7280">
          <span>📁</span>
          <span style="color:#374151;font-weight:500">${t.project}</span>
        </div>
        ${t.phase ? `
        <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#6B7280">
          <span>📌</span>
          <span>${t.phase}</span>
        </div>` : ''}
        <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#6B7280">
          <span>🗓</span>
          <span>${t.start} → ${t.end}</span>
        </div>
      </div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #F3F4F6;display:flex;align-items:center;gap:8px">
        <span style="
          background:${color};
          color:white;
          font-size:12px;
          font-weight:600;
          padding:3px 10px;
          border-radius:20px;
        ">${t.status}</span>
        <span style="font-size:12px;color:#9CA3AF">${t.progress}% 完成</span>
      </div>
    </div>`;
}

export function GanttPage() {
  const { selectedSnapshotId } = useAppStore();
  const ganttRef  = useRef<HTMLDivElement>(null);
  const ganttInst = useRef<any>(null);
  const [meta, setMeta]         = useState<TasksMeta>({ projects: [], phases: [], assignees: [] });
  const [project, setProject]   = useState('');
  const [phase,   setPhase]     = useState('');
  const [viewMode, setViewMode] = useState<'Week'|'Month'|'Quarter'>('Month');
  const [taskCount, setTaskCount] = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [noData,   setNoData]   = useState(false);

  useEffect(() => {
    if (selectedSnapshotId) getTasksMeta(selectedSnapshotId).then(setMeta);
  }, [selectedSnapshotId]);

  useEffect(() => {
    if (!selectedSnapshotId) return;
    setLoading(true); setNoData(false);

    getGantt({ snapshotId: selectedSnapshotId, projectName: project || undefined, phase: phase || undefined })
      .then(tasks => {
        setTaskCount(tasks.length);
        if (tasks.length === 0) { setNoData(true); return; }

        const normalized: GanttTask[] = tasks.map(t => ({
          ...t,
          end: t.end <= t.start
            ? new Date(new Date(t.start).getTime() + 86400000).toISOString().split('T')[0]
            : t.end,
        }));

        setTimeout(() => {
          if (!ganttRef.current) return;
          ganttRef.current.innerHTML = '';
          ganttInst.current = new Gantt(ganttRef.current, normalized, {
            view_mode:       viewMode,
            date_format:     'YYYY-MM-DD',
            bar_height:      32,          // 每列高度（預設 20）
            bar_corner_radius: 4,
            padding:         12,          // 行間距
            custom_popup_html: buildPopupHtml,
          });
        }, 50);
      })
      .finally(() => setLoading(false));
  }, [selectedSnapshotId, project, phase]);

  const changeView = (mode: 'Week'|'Month'|'Quarter') => {
    setViewMode(mode);
    if (ganttInst.current) ganttInst.current.change_view_mode(mode);
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center"
           style={{ borderTop: '3px solid #6366F1' }}>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          value={project} onChange={e => setProject(e.target.value)}
        >
          <option value="">全部專案</option>
          {meta.projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          value={phase} onChange={e => setPhase(e.target.value)}
        >
          <option value="">全部階段</option>
          {meta.phases.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <div className="flex gap-1.5 ml-auto">
          {VIEW_MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => changeView(key)}
              className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >{label}</button>
          ))}
        </div>
        <span className="text-sm text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
          {taskCount} 筆任務
        </span>
      </div>

      {/* Legend */}
      <div className="flex gap-5 mb-3 flex-wrap px-1">
        {Object.entries(STATUS_COLOR_MAP).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3.5 h-3.5 rounded-sm" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {loading  && <div className="py-10 text-center text-gray-400">載入中…</div>}
      {noData && !loading && <div className="py-10 text-center text-gray-400">無符合條件的任務（需有預計完成日）</div>}
      {!loading && !noData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto"
             style={{ borderTop: '3px solid #6366F1' }}>
          <div ref={ganttRef} style={{ padding: '16px 8px' }} />
        </div>
      )}
    </div>
  );
}
