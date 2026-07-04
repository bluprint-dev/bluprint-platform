import { create } from "zustand";
import { persist } from "zustand/middleware";

// --- BLOCK TANIMLARI --------------------------------------------------------
// Dex sayfasindaki 3 blok: Live Tokens, Create Token, Trending

export type BlockId = "live" | "create" | "trending";

export const BLOCK_META: Record<BlockId, { icon: string; title: string }> = {
  live: { icon: "\u25CF", title: "LIVE TOKENS" },
  create: { icon: "+", title: "CREATE TOKEN" },
  trending: { icon: "\u25B2", title: "TRENDING" },
};

const DEFAULT_ORDER: BlockId[] = ["live", "create", "trending"];

interface DexLayoutState {
  // Blogun ekrandaki sirasi (Reorder.Group'a bu diziyi veriyoruz)
  order: BlockId[];
  // Kucultulmus (collapsed) bloklar
  collapsed: Record<BlockId, boolean>;
  // Kapatilmis (kaldirilmis) bloklar
  closed: Record<BlockId, boolean>;
  // Su an buyutulmus (expanded) tek blok, yoksa null
  expanded: BlockId | null;
  // Mobilde tek seferde gosterilen bloğun index'i (visibleOrder uzerinden)
  mobileIndex: number;

  setOrder: (order: BlockId[]) => void;
  toggleCollapsed: (id: BlockId) => void;
  closeBlock: (id: BlockId) => void;
  openBlock: (id: BlockId) => void;
  expandBlock: (id: BlockId) => void;
  setMobileIndex: (index: number) => void;
  resetLayout: () => void;
}

export const useDexLayoutStore = create<DexLayoutState>()(
  persist(
    (set) => ({
      order: DEFAULT_ORDER,
      collapsed: { live: false, create: false, trending: false },
      closed: { live: false, create: false, trending: false },
      expanded: null,
      mobileIndex: 0,

      setOrder: (order) => set({ order }),

      toggleCollapsed: (id) =>
        set((state) => ({
          collapsed: { ...state.collapsed, [id]: !state.collapsed[id] },
        })),

      closeBlock: (id) =>
        set((state) => ({
          closed: { ...state.closed, [id]: true },
          // kapatilan blok o an buyutulmusse buyutmeyi de iptal et
          expanded: state.expanded === id ? null : state.expanded,
        })),

      openBlock: (id) =>
        set((state) => ({
          closed: { ...state.closed, [id]: false },
        })),

      expandBlock: (id) =>
        set((state) => ({
          // ayni bloga tekrar basilirsa kucult (toggle), farkli bloga basilirsa onu buyut
          expanded: state.expanded === id ? null : id,
        })),

      setMobileIndex: (index) => set({ mobileIndex: index }),

      resetLayout: () =>
        set({
          order: DEFAULT_ORDER,
          collapsed: { live: false, create: false, trending: false },
          closed: { live: false, create: false, trending: false },
          expanded: null,
          mobileIndex: 0,
        }),
    }),
    {
      name: "dex-layout-storage", // localStorage key
    }
  )
);