'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import { PharmaAPI } from '@/lib/api';

interface Stats { totalLeads:number; ordersThisMonth:number; adImpressions:number; activeAds:number; activePromotions?:number; }

export default function PharmaceuticalDashboard() {
  const [stats,   setStats]   = useState<Stats|null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    PharmaAPI.getDashboard()
      .then(r => setStats(r.data))
      .catch(()=>setError('Failed to load dashboard'))
      .finally(()=>setLoading(false));
  }, []);

  const cards = stats ? [
    { label:'Total Leads',       value: stats.totalLeads,       icon:'📊', color:'from-blue-500 to-blue-600' },
    { label:'Orders This Month', value: stats.ordersThisMonth,  icon:'📦', color:'from-emerald-500 to-emerald-600' },
    { label:'Ad Impressions',    value: stats.adImpressions,    icon:'👁️', color:'from-violet-500 to-violet-600' },
    { label:'Active Ads',        value: stats.activeAds ?? 0,   icon:'📢', color:'from-orange-500 to-orange-600' },
  ] : [];

  return (
    <AuthGuard requiredRole="pharmaceutical">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Pharma Dashboard" subtitle="Leads, orders and ad overview" />
          <div className="p-6 space-y-6">
            {loading && <div className="text-center py-16 text-gray-500">Loading dashboard...</div>}
            {error   && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>}
            {!loading && stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {cards.map(card=>(
                    <div key={card.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
                      <div className="text-2xl font-bold text-white">{typeof card.value==='number'?card.value.toLocaleString():card.value}</div>
                      <div className="text-gray-400 text-sm mt-1">{card.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label:'Orders & Leads', href:'/pharmaceutical/orders', icon:'📦', desc:'Track leads and orders from CareBridge' },
                    { label:'Post an Ad',     href:'/pharmaceutical/ads',    icon:'📢', desc:'Reach doctors and patients directly' },
                  ].map(a=>(
                    <a key={a.label} href={a.href} className="bg-gray-900 border border-gray-800 hover:border-orange-500/50 rounded-2xl p-5 transition-all group">
                      <div className="text-2xl mb-3">{a.icon}</div>
                      <div className="text-white font-semibold text-sm group-hover:text-orange-400 transition-colors">{a.label}</div>
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
