import { create } from 'zustand';
import type { Snapshot, TabId } from '@/types';
import { getSnapshots, deleteSnapshot as apiDelete } from '@/api';

interface AppStore {
  snapshots: Snapshot[];
  selectedSnapshotId: number | null;
  currentTab: TabId;
  uploadModalOpen: boolean;

  loadSnapshots: () => Promise<void>;
  selectSnapshot: (id: number) => void;
  deleteSnapshot: (id: number) => Promise<void>;
  setTab: (tab: TabId) => void;
  setUploadModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  snapshots: [],
  selectedSnapshotId: null,
  currentTab: 'dashboard',
  uploadModalOpen: false,

  async loadSnapshots() {
    const snapshots = await getSnapshots();
    set(state => ({
      snapshots,
      selectedSnapshotId: state.selectedSnapshotId ?? snapshots[0]?.id ?? null,
    }));
  },

  selectSnapshot(id) {
    set({ selectedSnapshotId: id });
  },

  async deleteSnapshot(id) {
    await apiDelete(id);
    await get().loadSnapshots();
    if (get().selectedSnapshotId === id) {
      const first = get().snapshots[0];
      set({ selectedSnapshotId: first?.id ?? null });
    }
  },

  setTab(tab) {
    set({ currentTab: tab });
  },

  setUploadModalOpen(open) {
    set({ uploadModalOpen: open });
  },
}));
