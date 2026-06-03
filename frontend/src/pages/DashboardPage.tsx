import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppStore } from '@/store/appStore';
import { getDashboardSummary, getDashboardByProject, getDashboardByPhase } from '@/api';
import type { DashboardSummary, ProjectStat, PhaseStat } from '@/types';
import { projectColor, STATUS_COLORS } from '@/types';

const PIE_COLORS = [STATUS_COLORS['已完成'], STATUS_COLORS['進行中'], STATUS_COLORS['延遲'], STATUS_COLORS['未開始']];
const INIT_SHOW = 6;

// 區塊標題元件
function SectionTitle({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-1 h-5 rounded-full ${color}`} />
      <h3 className="text-sm font-semibold text-gray-700">{children}</h3>
    </div>
  );
}

export function DashboardPage() {
  const { selectedSnapshotId } = useAppStore();
  const [summary, setSummary]     = useState<DashboardSummary | null>(null);
  const [byProject, setByProject] = useState<ProjectStat[]>([]);
  const [byPhase, setByPhase]     = useState<PhaseStat[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAllProjects, setShowAllProjects] = useState(false);

  useEffect(() => {
    if (!selectedSnapshotId) return;
    setLoading(true);
    Promise.all([
      getDashboardSummary(selectedSnapshotId),
      getDashboardByProject(selectedSnapshotId),
      getDashboardByPhase(selectedSnapshotId),
    ]).then(([s, p, ph]) => { setSummary(s); setByProject(p); setByPhase(ph); })
      .finally(() => setLoading(false));
  }, [selectedSnapshotId]);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)] text-gray-400">載入中…</div>
  );
  if (!summary) return null;

  const pieData = [
    { name: '已完成', value: summary.completed },
    { name: '進行中', value: summary.inProgress },
    { name: '延遲',   value: summary.delayed },
    { name: '未開始', value: summary.notStarted },
  ];
  const visibleProjects = showAllProjects ? byProject : byProject.slice(0, INIT_SHOW);

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 5.5rem)' }}>

      {/* ── 統計卡片 ── */}
      <div className="grid grid-cols-5 gap-3 shrink-0">
        <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-0.5">總任務數</p>
          <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
        </div>
        <div className="rounded-xl px-4 py-3 border shadow-sm bg-emerald-500 border-emerald-500 text-white">
          <p className="text-xs opacity-80 mb-0.5">已完成</p>
          <p className="text-2xl font-bold">{summary.completed}</p>
          <p className="text-xs opacity-70 mt-0.5">{Math.round(summary.completionRate * 100)}%</p>
        </div>
        <div className="rounded-xl px-4 py-3 border shadow-sm bg-blue-500 border-blue-500 text-white">
          <p className="text-xs opacity-80 mb-0.5">進行中</p>
          <p className="text-2xl font-bold">{summary.inProgress}</p>
        </div>
        <div className="rounded-xl px-4 py-3 border shadow-sm bg-orange-400 border-orange-400 text-white">
          <p className="text-xs opacity-80 mb-0.5">延遲</p>
          <p className="text-2xl font-bold">{summary.delayed}</p>
        </div>
        <div className="rounded-xl px-4 py-3 border shadow-sm bg-red-500 border-red-500 text-white">
          <p className="text-xs opacity-80 mb-0.5">逾期未完成</p>
          <p className="text-2xl font-bold">{summary.overdueCount}</p>
        </div>
      </div>

      {/* ── 圖表列 ── */}
      <div className="grid grid-cols-2 gap-4 shrink-0" style={{ height: '260px' }}>
        {/* 圓餅圖 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-4 pb-3 flex flex-col"
             style={{ borderTop: '3px solid #6366F1' }}>
          <SectionTitle color="bg-indigo-500">整體狀態分佈</SectionTitle>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  dataKey="value"
                  strokeWidth={2}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} 筆`, name]}
                  contentStyle={{ fontSize: 13, borderRadius: 8 }}
                />
                <Legend
                  iconSize={12}
                  iconType="circle"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 13, paddingTop: 4 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 長條圖 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-4 pb-3 flex flex-col"
             style={{ borderTop: '3px solid #10B981' }}>
          <SectionTitle color="bg-emerald-500">各階段任務數量</SectionTitle>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPhase} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="phase" width={68} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend iconSize={12} iconType="circle" align="center" wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="completed"  name="已完成" fill={STATUS_COLORS['已完成']} stackId="a" />
                <Bar dataKey="inProgress" name="進行中" fill={STATUS_COLORS['進行中']} stackId="a" />
                <Bar dataKey="delayed"    name="延遲"   fill={STATUS_COLORS['延遲']}   stackId="a" />
                <Bar dataKey="notStarted" name="未開始" fill={STATUS_COLORS['未開始']} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── 各專案進度 ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-0 flex-1"
           style={{ borderTop: '3px solid #F59E0B' }}>
        {/* 表頭 */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-amber-400" />
            <h3 className="text-sm font-semibold text-gray-700">各專案進度</h3>
          </div>
          <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
            {byProject.length} 個專案
          </span>
        </div>

        {/* 表格 */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 sticky top-0 bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">專案名稱</th>
                <th className="px-4 py-2.5 text-center w-16 font-medium">完成率</th>
                <th className="px-4 py-2.5 text-left font-medium">進度條</th>
                <th className="px-4 py-2.5 text-center w-12 font-medium">總計</th>
                <th className="px-4 py-2.5 text-left font-medium">狀態標籤</th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.map((p, idx) => (
                <tr key={p.projectName}
                    className={`border-b border-gray-50 hover:bg-amber-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: projectColor(p.projectName) }} />
                      <span className="text-sm font-medium text-gray-800">{p.projectName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-sm font-bold text-gray-700">{Math.round(p.completionRate * 100)}%</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all"
                           style={{ width: `${Math.round(p.completionRate * 100)}%`, background: projectColor(p.projectName) }} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs text-gray-500">{p.total}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {p.inProgress > 0   && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-medium">{p.inProgress} 進行中</span>}
                      {p.delayed > 0      && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md font-medium">{p.delayed} 延遲</span>}
                      {p.overdueCount > 0 && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-medium">{p.overdueCount} 逾期</span>}
                      {p.notStarted > 0   && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">{p.notStarted} 未開始</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 顯示更多 */}
        {byProject.length > INIT_SHOW && (
          <div className="px-5 py-2.5 border-t border-gray-100 shrink-0 bg-gray-50 text-center">
            <button
              onClick={() => setShowAllProjects(v => !v)}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
            >
              {showAllProjects
                ? '▲ 收合'
                : `▼ 顯示全部 ${byProject.length} 個專案（目前顯示 ${INIT_SHOW} 個）`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
