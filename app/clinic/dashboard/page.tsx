'use client';

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';

interface Stats {
  totalPatients: number;
  bookingsToday: number;
  completedThisMonth: number;
  activeAds: number;
}

export default function ClinicDashboard() {
  const [stats, setStats] = useState<Stats>({ totalPatients: 0, bookingsToday: 0, completedThisMonth: 0, activeAds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/clinic/dashboard')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Patients',       value: stats.totalPatients,      icon: '🧑‍⚕️', color: 'from-emerald-500 to-emerald-600' },
    { label: "Today's Bookings",     value: stats.bookingsToday,      icon: '📋',   color: 'from-blue-500 to-blue-600' },
    { label: 'Completed This Month', value: stats.completedThisMonth, icon: '✅',   color: 'from-violet-500 to-violet-600' },
    { label: 'Active Ads',           value: stats.activeAds,          icon: '📢',   color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <AuthGuard requiredRole="clinic">
      {/* FIX: added ml-64 to offset fixed sidebar, min-w-0 to prevent overflow stretch */}
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 ml-64">
          <TopBar title="Clinic Dashboard" subtitle="Overview of your clinic activity on CareBridge" />
          <div className="p-6 space-y-6 max-w-7xl w-full">

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cards.map(card => (
                <div key={card.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-xl mb-3`}>
                    {card.icon}
                  </div>
                  <div className="text-2xl font-bold text-white">{loading ? '—' : card.value.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions — Patients & Bookings removed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Post an Ad',  href: '/clinic/ads',       icon: '📢', desc: 'Promote your clinic to CareBridge users' },
                { label: 'Analytics',   href: '/clinic/analytics', icon: '📈', desc: 'Track patient trends and ad performance' },
              ].map(action => (
                <a key={action.label} href={action.href} className="bg-gray-900 border border-gray-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all group">
                  <div className="text-2xl mb-3">{action.icon}</div>
                  <div className="text-white font-semibold text-sm group-hover:text-emerald-400 transition-colors">{action.label}</div>
                  <div className="text-gray-500 text-xs mt-1">{action.desc}</div>
                </a>
              ))}
            </div>

            {/* How CareBridge Works for Clinics */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-white font-semibold mb-4">How CareBridge Works for Clinics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: '1', title: 'Patients Book via App', desc: 'CareBridge users book appointments at your clinic through the consumer app.' },
                  { step: '2', title: 'You Get Notified',      desc: 'Real-time booking notifications sent to your panel dashboard.' },
                  { step: '3', title: 'Track & Grow',          desc: 'Monitor patient visits, revenue, and run ad campaigns.' },
                ].map(s => (
                  <div key={s.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{s.title}</div>
                      <div className="text-gray-400 text-xs mt-1">{s.desc}</div>
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
