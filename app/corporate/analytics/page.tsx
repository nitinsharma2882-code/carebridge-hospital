'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';

type Period = '7d' | '30d' | '90d' | 'all';
interface Stat { label: string; value: number; unit?: string; delta?: string; }
interface Monthly { month: string; value: number; }
interface Breakdown { label: string; value: number; color: string; }
interface AnalyticsData { stats: Stat[]; monthly: Monthly[]; breakdown: Breakdown[]; }

const FALLBACK: AnalyticsData = {
  stats: [
    { label: 'Active Employees',  value: 42,   delta: '+3' },
    { label: 'Total Bookings',    value: 87,   delta: '+12' },
    { label: 'Health Events',     value: 5,    delta: '+1' },
    { label: 'Avg Cost/Employee', value: 2499, unit: '₹', delta: '-5%' },
  ],
  monthly: [
    { month: 'Nov', value: 8 }, { month: 'Dec', value: 11 }, { month: 'Jan', value: 14 },
    { month: 'Feb', value: 17 }, { month: 'Mar', value: 22 }, { month: 'Apr', value: 15 },
  ],
  breakdown: [
    { label: 'OPD Visits',   value: 45, color: '#7c3aed' },
    { label: 'Ambulance',    value: 12, color: '#10b981' },
    { label: 'Lab Tests',    value: 20, color: '#f59e0b' },
    { label: 'Nursing Care', value: 10, color: '#3b82f6' },
  ],
};

export default function CorporateAnalytics() {
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<AnalyticsData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/corporate/analytics?period=${period}`)
      .then(r => setData(r.data ?? FALLBACK))
      .catch(() => setData(FALLBACK))
      .finally(() => setLoading(false));
  }, [period]);

  const handleDownload = () => {
    const lines = [
      'CAREBRIDGE CORPORATE ANALYTICS REPORT',
      `Period: ${period === 'all' ? 'All Time' : `Last ${period}`}`,
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      '', '=== SUMMARY ===',
      ...data.stats.map(s => `${s.label}: ${s.unit === '₹' ? '₹' : ''}${s.value.toLocaleString()}${s.unit && s.unit !== '₹' ? s.unit : ''} ${s.delta ? `(${s.delta})` : ''}`),
      '', '=== MONTHLY TREND ===',
      ...data.monthly.map(m => `${m.month}: ${m.value} bookings`),
      '', '=== SERVICE BREAKDOWN ===',
      ...data.breakdown.map(b => `${b.label}: ${b.value}`),
      '', 'CareBridge Healthcare Platform',
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carebridge-analytics-${period}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click(); URL.revokeObjectURL(url);
    setDownloaded(true); setTimeout(() => setDownloaded(false), 3000);
  };

  const maxMonthly = Math.max(...data.monthly.map(m => m.value), 1);
  const maxBreakdown = Math.max(...data.breakdown.map(b => b.value), 1);

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <TopBar title="Analytics" subtitle="Performance data and trend insights"
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
                  {(['7d','30d','90d','all'] as Period[]).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${period===p?'bg-gray-700 text-white':'text-gray-400 hover:text-white'}`}>
                      {p==='all'?'All time':`Last ${p}`}
                    </button>
                  ))}
                </div>
                <button onClick={handleDownload}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${downloaded?'bg-emerald-600 text-white':'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>
                  {downloaded ? '✅ Downloaded!' : '⬇ Download Report'}
                </button>
              </div>
            }
          />
          <div className="p-4 md:p-6 space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {loading ? Array.from({length:4}).map((_,i)=><div key={i} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 h-28 animate-pulse"/>)
              : data.stats.map(stat=>(
                <div key={stat.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                  <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
                  <div className="text-2xl font-bold text-white">{stat.unit==='₹'?`₹${stat.value.toLocaleString()}`:stat.value.toLocaleString()}{stat.unit&&stat.unit!=='₹'?stat.unit:''}</div>
                  {stat.delta&&<div className={`text-xs mt-1 ${stat.delta.startsWith('+')?'text-emerald-400':'text-red-400'}`}>{stat.delta} vs last period</div>}
                </div>
              ))}
            </div>
            {/* Monthly Trend */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-white font-semibold mb-6">Monthly Booking Trend</h3>
              <div className="flex items-end gap-3 h-40">
                {data.monthly.map(m=>(
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-gray-400 text-xs">{m.value}</div>
                    <div className="w-full rounded-t bg-gradient-to-t from-violet-600 to-violet-400 transition-all duration-500"
                      style={{height:`${(m.value/maxMonthly)*100}%`,minHeight:'4px'}}/>
                    <div className="text-gray-500 text-xs">{m.month}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Breakdown */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-white font-semibold mb-5">Service Breakdown</h3>
              <div className="space-y-4">
                {data.breakdown.map(b=>(
                  <div key={b.label} className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="text-gray-300">{b.label}</span><span className="text-white font-medium">{b.value}</span></div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-700" style={{width:`${(b.value/maxBreakdown)*100}%`,background:b.color}}/>
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
