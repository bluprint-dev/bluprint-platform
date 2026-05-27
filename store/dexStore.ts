import { create } from "zustand";
import type { DexToken } from "@/types/dex";

type DexStore = {
  search: string;
  selectedMint: string | null;
  isBuy: boolean;
  amount: string;
  optimisticTokens: DexToken[];

  setSearch: (search: string) => void;
  selectToken: (mint: string | null) => void;
  setIsBuy: (isBuy: boolean) => void;
  setAmount: (amount: string) => void;
  addOptimisticToken: (token: DexToken) => void;
  clearOptimisticTokens: () => void;
  resetTrade: () => void;
};

export const useDexStore = create<DexStore>((set) => ({
  search: "",
  selectedMint: null,
  isBuy: true,
  amount: "",
  optimisticTokens: [],

  setSearch: (search) => set({ search }),
  selectToken: (mint) => set({ selectedMint: mint }),
  setIsBuy: (isBuy) => set({ isBuy }),
  setAmount: (amount) => set({ amount }),
  addOptimisticToken: (token) =>
    set((state) => ({
      optimisticTokens: [
        token,
        ...state.optimisticTokens.filter((t) => t.mint !== token.mint),
      ],
      selectedMint: token.mint,
    })),
  clearOptimisticTokens: () => set({ optimisticTokens: [] }),
  resetTrade: () => set({ amount: "", isBuy: true }),
}));
