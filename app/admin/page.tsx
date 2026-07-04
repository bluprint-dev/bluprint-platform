"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

const ADMIN_WALLETS = [
  "aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x",
  "2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc",
];

interface Stats {
  totalTokens: number;
  totalUsers: number;
  totalReferralUsers: number;
  totalReferralEarnings: number;
  platformRevenue: number;
  totalSwapVolume: number;
  dailySwapVolume: number;
  dailySwapCount: number;
  totalTrades: number;
}

interface TopReferrer {
  wallet: string;
  earnings: number;
  referrals: number;
}

interface RecentToken {
  mint: string;
  name: string;
  symbol: string;
  createdAt: number;
}

export default function AdminPage() {
  const { publicKey, connected, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [recentTokens, setRecentTokens] = useState<RecentToken[]>([]);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const isAdmin = publicKey && ADMIN_WALLETS.includes(publicKey.toString());

  const verify = async () => {
    if (!publicKey || !signMessage || !isAdmin) return;
    setVerifying(true);
    setError('');
    try {
      const message = `Axor Admin Access ${Date.now()}`;
      const sig = await signMessage(new TextEncoder().encode(message));
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey.toString(),
          signature: Buffer.from(sig).toString('base64'),
          message,
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setAuthorized(true);
        await fetchData(data.token);
      } else {
        setError('Signature verification failed');
      }
    } catch (e: any) {
      setError(e.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const fetchData = async (token?: string) => {
    const t = token || localStorage.getItem('adminToken') || '';
    setLoading(true);
    try {
      const res = await fetch('/api/admin-stats', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setTopReferrers(data.topReferrers || []);
        setRecentTokens(data.recentTokens || []);
        setLastRefresh(new Date());
      } else {
        setError(data.error || 'Failed to fetch stats');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa açılırken token varsa otomatik yükle
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    try {
      const decoded = JSON.parse(atob(token));
      if (decoded.exp > Date.now() && ADMIN_WALLETS.includes(decoded.publicKey)) {
        setAuthorized(true);
        fetchData(token);
      }
    } catch {}
  }, []);

  const fmt = (n: number) => n.toFixed(2);
  const shortWallet = (w: string) => `${w.slice(0, 6)}...${w.slice(-4)}`;

  // Bağlı değil
  if (!connected) {
    return (
      <div className="min-h-screen bg-[#0F0817] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">🔐</div>
          <p className="text-white font-mono text-lg">Admin Panel</p>
          <p className="text-gray-400 text-sm">Connect your admin wallet</p>
          <button
            onClick={() => setVisible(true)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-mono text-sm transition"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Bağlı ama admin değil
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F0817] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl">🚫</div>
          <p className="text-red-400 font-mono">Unauthorized wallet</p>
          <p className="text-gray-500 text-xs">{publicKey?.toString()}</p>
        </div>
      </div>
    );
  }

  // Admin ama verify etmemiş
  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0F0817] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">✍️</div>
          <p className="text-white font-mono text-lg">Sign to authenticate</p>
          <p className="text-gray-400 text-sm text-xs">{shortWallet(publicKey.toString())}</p>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={verify}
            disabled={verifying}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-mono text-sm transition"
          >
            {verifying ? 'Signing...' : 'Sign Message'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0817] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-mono text-purple-400">Axor Admin</h1>
          <p className="text-gray-500 text-xs mt-1">
            {lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="px-4 py-2 bg-purple-900/50 hover:bg-purple-800/50 border border-purple-700/50 rounded-lg text-sm font-mono transition disabled:opacity-50"
        >
          {loading ? '⟳ Loading...' : '⟳ Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm font-mono">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Tokens', value: stats.totalTokens, icon: '🪙', color: 'purple' },
              { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'blue' },
              { label: 'Referral Users', value: stats.totalReferralUsers, icon: '🔗', color: 'green' },
              { label: 'Total Trades', value: stats.totalTrades, icon: '📊', color: 'yellow' },
            ].map((card) => (
              <div key={card.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-400 text-xs font-mono mb-1">{card.icon} {card.label}</p>
                <p className="text-2xl font-bold font-mono">{card.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Revenue Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Platform Revenue', value: fmt(stats.platformRevenue) + ' SOL', icon: '💰' },
              { label: 'Referral Paid Out', value: fmt(stats.totalReferralEarnings) + ' SOL', icon: '🎁' },
              { label: 'Total Swap Volume', value: fmt(stats.totalSwapVolume) + ' SOL', icon: '💱' },
              { label: 'Daily Swap Volume', value: fmt(stats.dailySwapVolume) + ' SOL', icon: '📈' },
            ].map((card) => (
              <div key={card.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-400 text-xs font-mono mb-1">{card.icon} {card.label}</p>
                <p className="text-xl font-bold font-mono text-green-400">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Daily Swap Count */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 inline-block">
            <p className="text-gray-400 text-xs font-mono mb-1">⚡ Daily Swap Count</p>
            <p className="text-3xl font-bold font-mono text-yellow-400">{stats.dailySwapCount}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Referrers */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h2 className="text-sm font-mono text-purple-400 mb-4">🏆 Top Referral Earners</h2>
              {topReferrers.length === 0 ? (
                <p className="text-gray-500 text-sm font-mono">No referrals yet</p>
              ) : (
                <div className="space-y-2">
                  {topReferrers.map((r, i) => (
                    <div key={r.wallet} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs font-mono w-4">#{i + 1}</span>
                        <a
                          href={`https://solscan.io/account/${r.wallet}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-blue-400 hover:text-blue-300"
                        >
                          {shortWallet(r.wallet)}
                        </a>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 text-sm font-mono">{fmt(r.earnings)} SOL</p>
                        <p className="text-gray-500 text-xs">{r.referrals} refs</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Tokens */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h2 className="text-sm font-mono text-purple-400 mb-4">🪙 Recent Tokens</h2>
              {recentTokens.length === 0 ? (
                <p className="text-gray-500 text-sm font-mono">No tokens yet</p>
              ) : (
                <div className="space-y-2">
                  {recentTokens.map((t) => (
                    <div key={t.mint} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm font-mono text-white">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.symbol}</p>
                      </div>
                      <div className="text-right">
                        <a
                          href={`https://solscan.io/token/${t.mint}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-blue-400 hover:text-blue-300"
                        >
                          {shortWallet(t.mint)}
                        </a>
                        <p className="text-gray-500 text-xs">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '?'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}