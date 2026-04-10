'use client';

// components/AnalyticsPage.tsx — Shared analytics for all admin panels
// Fetches from /api/{role}/analytics?period=30d and renders real data

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { UserRole } from '@/lib/auth';

type Period = '7d' | '30d' | '90d' | 'all';

interface AnalyticsData {
  stats: { label: string; value: number; unit?: string; delta?: string }[];
  monthly: { month: string; value: number }[];
  breakdown: { label: string; value: number; color: string }[];
}

interface Props {
  role: UserRole;
  apiBase: string;
  accentColor: string;
}

export default function AnalyticsPage({ role, apiBase, accentColor }: Props) {
  const [period,  setPeriod]  = useState<Period>('30d');
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    api.get(`${apiBase}/analytics?period=${period}`)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [apiBase, period]);

  const maxMonthly = Math.max(...(data?.monthly?.map(m => m.value) ?? []), 1);
  const totalBreakdown = (data?.breakdown ?? []).reduce((s, b) => s + b.value, 0) || 1;

  return (
    <AuthGuard requiredRole={role}>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar
            title="Analytics"
            subtitle="Performance data and trend insights"
            actions={
              <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
                {(['7d', '30d', '90d', 'all'] as const).map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${period === p ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
                    {p === 'all' ? 'All time' : `Last ${p}`}
                  </button>
                ))}
              </div>
            }
          />

          <div className="p-6 space-y-6">
            {loading && <div className="text-center py-16 text-gray-500">Loading analytics...</div>}
            {error   && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

            {!loading && data && (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.stats.map((s, i) => (
                    <div key={i} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                      <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">{s.label}</div>
                      <div className="text-white text-2xl font-bold">{s.unit}{s.value?.toLocaleString()}</div>
                      {s.delta && <div className="text-emerald-400 text-xs font-semibold mt-1">{s.delta} this period</div>}
                    </div>
                  ))}
                </div>

                {/* Monthly trend */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                  <div className="text-white font-semibold mb-6">Monthly Trend</div>
                  <div className="flex items-end gap-3 h-36">
                    {data.monthly.map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="text-gray-400 text-xs font-medium">{m.value}</div>
                        <div
                          className={`w-full rounded-t-lg bg-gradient-to-t ${accentColor} opacity-80`}
                          style={{ height: `${Math.max(4, (m.value / maxMonthly) * 120)}px`, transition: 'height 0.5s ease' }}
                        />
                        <div className="text-gray-500 text-xs">{m.month}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breakdown */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                  <div className="text-white font-semibold mb-4">Service Breakdown</div>
                  <div className="space-y-3">
                    {data.breakdown.map((b, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-300 font-medium">{b.label}</span>
                          <span className="text-white font-bold">{b.value}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(b.value / totalBreakdown) * 100}%`, background: b.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
