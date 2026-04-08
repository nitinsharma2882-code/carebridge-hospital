'use client';

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import axios from '@/lib/api';

interface Stats {
  totalEmployees: number;
  activeSubscriptions: number;
  bookingsThisMonth: number;
  healthEventsScheduled: number;
  engagementRate: number;
  monthlyCost: number;
}

const defaultStats: Stats = {
  totalEmployees: 0,
  activeSubscriptions: 0,
  bookingsThisMonth: 0,
  healthEventsScheduled: 0,
  engagementRate: 0,
  monthlyCost: 0,
};

export default function CorporateDashboard() {
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/corporate/dashboard')
      .then(r => setStats(r.data))
      .catch(() => setStats(defaultStats))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Employees',      value: stats.totalEmployees,        icon: '👥', color: 'from-blue-500 to-blue-600' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions,   icon: '✅', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Bookings This Month',  value: stats.bookingsThisMonth,     icon: '📋', color: 'from-violet-500 to-violet-600' },
    { label: 'Health Events',        value: stats.healthEventsScheduled, icon: '🏕️', color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <TopBar title="Dashboard" subtitle="Employee healthcare overview" />
          <div className="p-6 space-y-6">

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-4">
              {cards.map((card) => (
                <div key={card.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-xl mb-3`}>
                    {card.icon}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {loading ? '—' : card.value.toLocaleString()}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Engagement + Cost row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Employee Engagement Rate</div>
                <div className="text-3xl font-bold text-white mb-3">
                  {loading ? '—' : `${stats.engagementRate}%`}
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-violet-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${stats.engagementRate}%` }}
                  />
                </div>
              </div>
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Monthly Healthcare Cost</div>
                <div className="text-3xl font-bold text-white">
                  {loading ? '—' : `₹${stats.monthlyCost.toLocaleString()}`}
                </div>
                <div className="text-emerald-400 text-sm mt-2">↓ 8% vs last month</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Add Employees',    href: '/corporate/employees',    icon: '👥', desc: 'Manage your team & family members' },
                { label: 'Schedule Health Event', href: '/corporate/events', icon: '🏕️', desc: 'Create camps & health checkups' },
                { label: 'View Billing',     href: '/corporate/billing',      icon: '💳', desc: 'Track monthly usage & invoices' },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-2xl p-5 transition-all group"
                >
                  <div className="text-2xl mb-3">{action.icon}</div>
                  <div className="text-white font-semibold text-sm group-hover:text-violet-400 transition-colors">
                    {action.label}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">{action.desc}</div>
                </a>
              ))}
            </div>

          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
