'use client';

// components/AnalyticsPage.tsx — Reusable analytics page for all roles
// Renders bar charts + stat cards using pure CSS (no extra chart lib needed).

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';
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
  accentColor: string; // tailwind gradient class e.g. 'from-violet-500 to-violet-600'
}

export default function AnalyticsPage({ role, apiBase, accentColor }: Props) {
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${apiBase}/analytics?period=${period}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [apiBase, period]);

  const maxMonthly = Math.max(...(data?.monthly.map(m => m.value) ?? [1]), 1);
  const maxBreakdown = Math.max(...(data?.breakdown.map(b => b.value) ?? [1]), 1);

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
                {(['7d', '30d', '90d', 'all'] as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      period === p ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {p === 'all' ? 'All time' : `Last ${p}`}
                  </button>
                ))}
              </div>
            }
          />

          <div className="p-6 space-y-6">

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 h-28 animate-pulse" />
                ))
              ) : (data?.stats ?? []).map(stat => (
                <div key={stat.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                  <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
                  <div className="text-2xl font-bold text-white">
                    {stat.unit === '₹' ? `₹${stat.value.toLocaleString()}` : stat.value.toLocaleString()}
                    {stat.unit && stat.unit !== '₹' ? stat.unit : ''}
                  </div>
                  {stat.delta && (
                    <div className={`text-xs mt-1 ${stat.delta.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stat.delta} vs last period
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Monthly Trend Bar Chart */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-white font-semibold mb-6">Monthly Trend</h3>
              {loading ? (
                <div className="h-40 flex items-end gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-gray-800 rounded-t animate-pulse" style={{ height: `${40 + i * 15}%` }} />
                  ))}
                </div>
              ) : (
                <div className="flex items-end gap-3 h-40">
                  {(data?.monthly ?? []).map(m => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-gray-400 text-xs">{m.value}</div>
                      <div
                        className={`w-full rounded-t bg-gradient-to-t ${accentColor} transition-all duration-500`}
                        style={{ height: `${(m.value / maxMonthly) * 100}%`, minHeight: '4px' }}
                      />
                      <div className="text-gray-500 text-xs">{m.month}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-white font-semibold mb-5">Breakdown</h3>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
                  ))
                ) : (data?.breakdown ?? []).map(b => (
                  <div key={b.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{b.label}</span>
                      <span className="text-white font-medium">{b.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${(b.value / maxBreakdown) * 100}%`, background: b.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
