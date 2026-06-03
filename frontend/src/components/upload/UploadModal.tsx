import { useState, useRef } from 'react';
import { X, FileUp } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { uploadExcel } from '@/api';

export function UploadModal() {
  const { setUploadModalOpen, loadSnapshots, selectSnapshot } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setFile(null); setLabel(''); setError(''); setSuccess(''); };

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f && !label) setLabel(f.name.replace(/\.[^/.]+$/, ''));
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) { setError('請選擇 Excel 檔案'); return; }
    if (!label.trim()) { setError('請輸入快照標籤'); return; }
    setUploading(true); setError('');
    try {
      const res = await uploadExcel(file, label.trim());
      setSuccess(`✓ 成功匯入 ${res.rowCount} 筆任務`);
      await loadSnapshots();
      selectSnapshot(res.snapshotId);
      setTimeout(() => { setUploadModalOpen(false); reset(); }, 1200);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">匯入 Excel 進度表</h2>
          <button onClick={() => { setUploadModalOpen(false); reset(); }} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">快照標籤</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="例：2026-06 月報"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Excel 檔案</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <FileUp className="mx-auto w-10 h-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">{file ? file.name : '點擊選擇 .xlsx 檔案'}</p>
              <p className="text-xs text-gray-400 mt-1">最大 20MB</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setUploadModalOpen(false); reset(); }}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
            >取消</button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >{uploading ? '上傳中…' : '確認匯入'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
