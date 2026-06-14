import { useCallback, useEffect, useState } from "react";

export type Trade = {
  id: number;
  mint: string;
  price: number;
  amount_sol: number;
  amount_token: number;
  is_buy: boolean;
  wallet: string;
  tx_signature: string | null;
  created_at: string;
};

export function useTrades(mint: string | null) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrades = useCallback(async () => {
    if (!mint) {
      setTrades([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/trades?mint=${encodeURIComponent(mint)}`);
      const json = await res.json();
      setTrades(json.success ? (json.trades ?? []) : []);
    } catch {
      setTrades([]);
    } finally {
      setIsLoading(false);
    }
  }, [mint]);

  useEffect(() => {
    if (!mint) {
      setTrades([]);
      return;
    }
    fetchTrades();
    const timer = setInterval(fetchTrades, 5000);
    return () => clearInterval(timer);
  }, [mint, fetchTrades]);

  return { trades, isLoading };
}