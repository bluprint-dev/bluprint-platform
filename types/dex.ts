export type DexToken = {
  mint: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  creator?: string;
  createdAt?: number;
};

export type DexTokensResponse = {
  success: boolean;
  tokens: DexToken[];
  total: number;
};

export type SwapBuildResponse =
  | {
      success: true;
      transaction: string;
      amountOut: string;
      amountIn: string;
      fee: string;
      creatorFee: string;
      lastValidBlockHeight?: number;
    }
  | { success?: false; error: string };

