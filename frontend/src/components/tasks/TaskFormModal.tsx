import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createTask, updateTask } from '@/api';
import type { Task } from '@/types';

const STATUSES = ['未開始', '進行中', '已完成', '延遲'];

interface Props {
  mode: 'create' | 'edit';
  task?: Task;
  snapshotId: number;
  projects: string[];
  phases: string[];
  onClose: () => void;
  onSaved: () => void;
}

function toDateInput(d: string | null | undefined): string {
  if (!d) return '';
  return d.slice(0, 10);
}

export function TaskFormModal({ mode, task, snapshotId, projects, phases, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    checkpointName:     task?.checkpointName ?? '',
    projectName:        task?.projectName ?? (projects[0] ?? ''),
    isFormalCheckpoint: task?.isFormalCheckpoint ?? false,
    phase:              task?.phase ?? '',
    plannedDate:        toDateInput(task?.plannedDate),
    status:             task?.status ?? '未開始',
    assignees:          (task?.assignees ?? []).join('、'),
    actualDate:         toDateInput(task?.actualDate),
    remarks:            task?.remarks ?? '',
    isOverdue:          task?.isOverdue ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.checkpointName.trim()) { setError('查核點/工作事項不可空白'); return; }
    if (!form.projectName.trim())    { setError('專案名稱不可空白'); return; }

    setSaving(true); setError('');
    try {
      const payload = {
        snapshotId,
        checkpointName:     form.checkpointName.trim(),
        projectName:        form.projectName.trim(),
        isFormalCheckpoint: form.isFormalCheckpoint,
        phase:              form.phase || null,
        plannedDate:        form.plannedDate || null,
        status:             form.status,
        assignees:          form.assignees.split(/[,，、]/).map(s => s.trim()).filter(Boolean),
        actualDate:         form.actualDate || null,
        remarks:            form.remarks.trim() || null,
        isOverdue:          form.isOverdue,
      };

      if (mode === 'create') await createTask(payload);
      else await updateTask(task!.id, payload);

      onSaved();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-800">
            {mode === 'create' ? '新增任務' : '編輯任務'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          {/* 查核點名稱 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">查核點/工作事項 <span className="text-red-500">*</span></label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.checkpointName}
              onChange={e => set('checkpointName', e.target.value)}
              placeholder="輸入查核點名稱"
            />
          </div>

          {/* 專案 + 階段 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">專案名稱 <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.projectName}
                onChange={e => set('projectName', e.target.value)}
              >
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="__custom__">＋ 輸入新專案</option>
              </select>
              {form.projectName === '__custom__' && (
                <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="輸入新專案名稱" onChange={e => set('projectName', e.target.value)} />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">階段</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.phase}
                onChange={e => set('phase', e.target.value)}
              >
                <option value="">（無）</option>
                {phases.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* 狀態 + 正式查核點 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">目前進度</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  checked={form.isFormalCheckpoint}
                  onChange={e => set('isFormalCheckpoint', e.target.checked)}
                />
                <span className="text-xs font-medium text-gray-700">正式查核點</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none mt-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  checked={form.isOverdue}
                  onChange={e => set('isOverdue', e.target.checked)}
                />
                <span className="text-xs font-medium text-gray-700">標記為逾期</span>
              </label>
            </div>
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">預計完成日</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.plannedDate} onChange={e => set('plannedDate', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">實際完成日</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.actualDate} onChange={e => set('actualDate', e.target.value)} />
            </div>
          </div>

          {/* 負責人 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">負責人（用逗號或頓號分隔）</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.assignees}
              onChange={e => set('assignees', e.target.value)}
              placeholder="例：佩珊、Ming"
            />
          </div>

          {/* 備註 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">備註/風險說明</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={form.remarks}
              onChange={e => set('remarks', e.target.value)}
              placeholder="選填"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">取消</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '儲存中…' : (mode === 'create' ? '新增任務' : '儲存變更')}
          </button>
        </div>
      </div>
    </div>
  );
}
