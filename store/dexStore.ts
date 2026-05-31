import { create } from "zustand";
import type { DexToken } from "@/types/dex";

// ✅ FIX: Store'da mint ve genesisAccount kavramları ayrıştırıldı.
//
// selectedMint       → token listesinde seçili token'ı bulmak için (t.mint === selectedMint)
//                      UI'da display, URL param, ATA için kullanılır
// selectedGenesisAccount → curve info, swap, quote için kullanılır
//                          DexPageContent bu değeri useBondingCurveInfo ve useSwap'a geçirir
//
// İkisi birlikte set edilir — selectToken her ikisini birden alır.

type DexStore = {
  search: string;
  selectedMint: string | null;
  selectedGenesisAccount: string | null; // ✅ bonding curve ops için
  isBuy: boolean;
  amount: string;
  optimisticTokens: DexToken[];

  setSearch: (search: string) => void;
  // ✅ FIX: selectToken artık hem mint hem genesisAccount alıyor
  selectToken: (mint: string | null, genesisAccount?: string | null) => void;
  setIsBuy: (isBuy: boolean) => void;
  setAmount: (amount: string) => void;
  addOptimisticToken: (token: DexToken) => void;
  clearOptimisticTokens: () => void;
  resetTrade: () => void;
};

export const useDexStore = create<DexStore>((set) => ({
  search: "",
  selectedMint: null,
  selectedGenesisAccount: null, // ✅ yeni alan
  isBuy: true,
  amount: "",
  optimisticTokens: [],

  setSearch: (search) => set({ search }),

  // ✅ FIX: mint ve genesisAccount birlikte set ediliyor
  // genesisAccount verilmezse null — DexPageContent token.genesisAccount ?? token.mint ile handle eder
  selectToken: (mint, genesisAccount = null) =>
    set({
      selectedMint: mint,
      selectedGenesisAccount: genesisAccount,
    }),

  setIsBuy: (isBuy) => set({ isBuy }),
  setAmount: (amount) => set({ amount }),

  addOptimisticToken: (token) =>
    set((state) => ({
      optimisticTokens: [
        token,
        ...state.optimisticTokens.filter((t) => t.mint !== token.mint),
      ],
      selectedMint: token.mint,
      // ✅ FIX: yeni token eklendiğinde genesisAccount da set ediliyor
      selectedGenesisAccount: token.genesisAccount ?? null,
    })),

  clearOptimisticTokens: () => set({ optimisticTokens: [] }),
  resetTrade: () => set({ amount: "", isBuy: true }),
}));