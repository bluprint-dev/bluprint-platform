import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  useEffect(() => {
    if (!mint) { setTrades([]); return; }

    let cancelled = false;

    const fetchTrades = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("mint", mint)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!cancelled) {
        setTrades(error ? [] : (data ?? []));
        setIsLoading(false);
      }
    };

    fetchTrades();

    // Realtime subscription — yeni trade gelince otomatik güncelle
    const channel = supabase
      .channel(`trades:${mint}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trades", filter: `mint=eq.${mint}` },
        (payload: { new: Trade }) => {
          setTrades((prev) => [payload.new, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [mint]);

  return { trades, isLoading };
}