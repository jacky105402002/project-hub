import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { getAlerts } from '@/api';
import { TopNav } from '@/components/layout/TopNav';
import { UploadModal } from '@/components/upload/UploadModal';
import { DashboardPage } from '@/pages/DashboardPage';
import { TasksPage }    from '@/pages/TasksPage';
import { GanttPage }    from '@/pages/GanttPage';
import { AlertsPage }   from '@/pages/AlertsPage';

export default function App() {
  const { currentTab, snapshots, selectedSnapshotId, uploadModalOpen, loadSnapshots } = useAppStore();
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => { loadSnapshots(); }, []);

  useEffect(() => {
    if (!selectedSnapshotId) return;
    getAlerts({ snapshotId: selectedSnapshotId })
      .then(d => setOverdueCount(d.overdueTotal))
      .catch(() => {});
  }, [selectedSnapshotId]);

  const hasData = snapshots.length > 0 && selectedSnapshotId;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav overdueCount={overdueCount} />

      {/* Dashboard 需要填滿剩餘高度，其他頁面正常滾動 */}
      <main
        className={`max-w-screen-xl mx-auto px-4 ${currentTab === 'dashboard' && hasData ? 'py-4 overflow-hidden' : 'py-6'}`}
        style={currentTab === 'dashboard' && hasData ? { height: 'calc(100vh - 3.5rem)' } : undefined}
      >
        {!hasData && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg mb-2">尚未匯入任何資料</p>
            <p className="text-gray-400 text-sm mb-6">請點擊右上角「匯入 Excel」上傳專案進度表</p>
            <button
              onClick={() => useAppStore.getState().setUploadModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >立即匯入</button>
          </div>
        )}

        {hasData && currentTab === 'dashboard' && <DashboardPage />}
        {hasData && currentTab === 'tasks'     && <TasksPage />}
        {hasData && currentTab === 'gantt'     && <GanttPage />}
        {hasData && currentTab === 'alerts'    && <AlertsPage />}
      </main>

      {uploadModalOpen && <UploadModal />}
    </div>
  );
}
