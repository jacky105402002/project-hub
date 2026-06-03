import { ClipboardList, Upload, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { TabId } from '@/types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tasks',     label: '任務清單' },
  { id: 'gantt',     label: '甘特圖' },
  { id: 'alerts',    label: '警示' },
];

export function TopNav({ overdueCount }: { overdueCount: number }) {
  const { snapshots, selectedSnapshotId, currentTab, setTab, selectSnapshot, deleteSnapshot, setUploadModalOpen } = useAppStore();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-5 flex items-center h-[52px] gap-5">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-800 text-base">專案進度管理</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-1 justify-center">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}

              {/* 警示 Badge — 放大版，清楚可見 */}
              {tab.id === 'alerts' && overdueCount > 0 && (
                <span className={`
                  absolute -top-2 -right-2
                  bg-red-500 text-white
                  text-xs font-bold
                  min-w-[22px] h-[22px]
                  flex items-center justify-center
                  rounded-full px-1
                  border-2 border-white
                  shadow-sm
                `}>
                  {overdueCount > 99 ? '99+' : overdueCount > 9 ? `${overdueCount}` : overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Snapshot Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-gray-500 whitespace-nowrap">資料快照</span>
          <select
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 max-w-[210px]"
            value={selectedSnapshotId ?? ''}
            onChange={e => selectSnapshot(Number(e.target.value))}
          >
            {snapshots.length === 0 && <option value="">（尚無資料）</option>}
            {snapshots.map(s => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.rowCount}筆)
              </option>
            ))}
          </select>
          {selectedSnapshotId && (
            <button
              onClick={() => { if (confirm('確定刪除此快照？此操作無法還原。')) deleteSnapshot(selectedSnapshotId); }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
              title="刪除快照"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setUploadModalOpen(true)}
          className="shrink-0 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Upload className="w-4 h-4" />
          匯入 Excel
        </button>
      </div>
    </nav>
  );
}
