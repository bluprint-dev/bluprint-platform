import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── BLOCK TANIMLARI ──────────────────────────────────────────────────────────
// Dex sayfasındaki 3 blok: Live Tokens (sol), Create Token (orta), Trending (sağ)

export type BlockId = "live" | "create" | "trending";

export const BLOCK_META: Record<BlockId, { icon: string; title: string }> = {
  live: { icon: "◎", title: "LIVE TOKENS" },
  create: { icon: "＋", title: "CREATE TOKEN" },
  trending: { icon: "▲", title: "TRENDING" },
};

const DEFAULT_ORDER: BlockId[] = ["live", "create", "trending"];

interface DexLayoutState {
  // Bloğun ekrandaki sırası (Reorder.Group'a bu diziyi veriyoruz)
  order: BlockId[];
  // Küçültülmüş (collapsed) bloklar
  collapsed: Record<BlockId, boolean>;
  // Kapatılmış (kaldırılmış) bloklar
  closed: Record<BlockId, boolean>;

  setOrder: (order: BlockId[]) => void;
  toggleCollapsed: (id: BlockId) => void;
  closeBlock: (id: BlockId) => void;
  openBlock: (id: BlockId) => void;
  resetLayout: () => void;
}

export const useDexLayoutStore = create<DexLayoutState>()(
  persist(
    (set) => ({
      order: DEFAULT_ORDER,
      collapsed: { live: false, create: false, trending: false },
      closed: { live: false, create: false, trending: false },

      setOrder: (order) => set({ order }),

      toggleCollapsed: (id) =>
        set((state) => ({
          collapsed: { ...state.collapsed, [id]: !state.collapsed[id] },
        })),

      closeBlock: (id) =>
        set((state) => ({
          closed: { ...state.closed, [id]: true },
        })),

      openBlock: (id) =>
        set((state) => ({
          closed: { ...state.closed, [id]: false },
        })),

      resetLayout: () =>
        set({
          order: DEFAULT_ORDER,
          collapsed: { live: false, create: false, trending: false },
          closed: { live: false, create: false, trending: false },
        }),
    }),
    {
      name: "dex-layout-storage", // localStorage key
    }
  )
);