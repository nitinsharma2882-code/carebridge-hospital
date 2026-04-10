'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import { CorporateAPI } from '@/lib/api';

interface Stats {
  totalEmployees: number; activeSubscriptions: number;
  bookingsThisMonth: number; healthEventsScheduled: number;
  engagementRate: number; monthlyCost: number;
}

export default function CorporateDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    CorporateAPI.getDashboard()
      .then(r => setStats(r.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Employees',        value: stats.totalEmployees,        icon: '👥', color: 'from-violet-500 to-violet-600' },
    { label: 'Bookings This Month',    value: stats.bookingsThisMonth,     icon: '📋', color: 'from-blue-500 to-blue-600' },
    { label: 'Health Events',          value: stats.healthEventsScheduled, icon: '🏕️', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Monthly Cost',           value: `₹${stats.monthlyCost?.toLocaleString() ?? 0}`, icon: '💳', color: 'from-orange-500 to-orange-600' },
  ] : [];

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Corporate Dashboard" subtitle="Overview of your corporate healthcare activity" />
          <div className="p-6 space-y-6">

            {loading && <div className="text-center py-16 text-gray-500">Loading dashboard...</div>}
            {error   && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

            {!loading && stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {cards.map(card => (
                    <div key={card.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
                      <div className="text-2xl font-bold text-white">{card.value}</div>
                      <div className="text-gray-400 text-sm mt-1">{card.label}</div>
                    </div>
                  ))}
                </div>

                {/* Engagement rate bar */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-white font-semibold">Employee Engagement Rate</div>
                    <div className="text-violet-400 font-bold">{stats.engagementRate}%</div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700" style={{ width: `${stats.engagementRate}%` }} />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Add Employees',    href: '/corporate/employees',      icon: '👥', desc: 'Manage your team' },
                    { label: 'Schedule Event',   href: '/corporate/events',         icon: '🏕️', desc: 'Create health camps' },
                    { label: 'View Billing',     href: '/corporate/billing',        icon: '💳', desc: 'Track invoices' },
                  ].map(a => (
                    <a key={a.label} href={a.href} className="bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-2xl p-5 transition-all group">
                      <div className="text-2xl mb-3">{a.icon}</div>
                      <div className="text-white font-semibold text-sm group-hover:text-violet-400 transition-colors">{a.label}</div>
                      <div className="text-gray-500 text-xs mt-1">{a.desc}</div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
