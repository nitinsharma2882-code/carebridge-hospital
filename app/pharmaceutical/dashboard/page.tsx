'use client';

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';

interface Stats {
  activePromotions: number;
  totalLeads: number;
  ordersThisMonth: number;
  adImpressions: number;
}

export default function PharmaceuticalDashboard() {
  const [stats, setStats] = useState<Stats>({ activePromotions: 0, totalLeads: 0, ordersThisMonth: 0, adImpressions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/pharmaceutical/dashboard')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Active Promotions',  value: stats.activePromotions, icon: '🎯', color: 'from-orange-500 to-orange-600' },
    { label: 'Total Leads',        value: stats.totalLeads,       icon: '📊', color: 'from-blue-500 to-blue-600' },
    { label: 'Orders This Month',  value: stats.ordersThisMonth,  icon: '📦', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Ad Impressions',     value: stats.adImpressions,    icon: '👁️', color: 'from-violet-500 to-violet-600' },
  ];

  return (
    <AuthGuard requiredRole="pharmaceutical">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Pharma Dashboard" subtitle="Promotions, leads and order overview" />
          <div className="p-6 space-y-6">

            <div className="grid grid-cols-4 gap-4">
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

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'View Orders',      href: '/pharmaceutical/orders',     icon: '📦', desc: 'Track leads and orders from CareBridge' },
                { label: 'Post an Ad',       href: '/pharmaceutical/ads',        icon: '📢', desc: 'Reach doctors and patients directly' },
              ].map(action => (
                <a key={action.label} href={action.href} className="bg-gray-900 border border-gray-800 hover:border-orange-500/50 rounded-2xl p-5 transition-all group">
                  <div className="text-2xl mb-3">{action.icon}</div>
                  <div className="text-white font-semibold text-sm group-hover:text-orange-400 transition-colors">{action.label}</div>
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
