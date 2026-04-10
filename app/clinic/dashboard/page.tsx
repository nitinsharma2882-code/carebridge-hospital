'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import { ClinicAPI } from '@/lib/api';

interface Stats { totalPatients:number; bookingsToday:number; completedThisMonth:number; activeAds:number; }

export default function ClinicDashboard() {
  const [stats,   setStats]   = useState<Stats|null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    ClinicAPI.getDashboard()
      .then(r => setStats(r.data))
      .catch(()=>setError('Failed to load dashboard'))
      .finally(()=>setLoading(false));
  }, []);

  const cards = stats ? [
    { label:'Total Patients',       value:stats.totalPatients,      icon:'🧑‍⚕️', color:'from-emerald-500 to-emerald-600' },
    { label:"Today's Bookings",     value:stats.bookingsToday,      icon:'📋',   color:'from-blue-500 to-blue-600' },
    { label:'Completed This Month', value:stats.completedThisMonth, icon:'✅',   color:'from-violet-500 to-violet-600' },
    { label:'Active Ads',           value:stats.activeAds,          icon:'📢',   color:'from-orange-500 to-orange-600' },
  ] : [];

  return (
    <AuthGuard requiredRole="clinic">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Clinic Dashboard" subtitle="Overview of your clinic activity on CareBridge" />
          <div className="p-6 space-y-6">
            {loading && <div className="text-center py-16 text-gray-500">Loading dashboard...</div>}
            {error   && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>}
            {!loading && stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {cards.map(card=>(
                    <div key={card.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
                      <div className="text-2xl font-bold text-white">{card.value.toLocaleString()}</div>
                      <div className="text-gray-400 text-sm mt-1">{card.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label:'Post an Ad',  href:'/clinic/ads',       icon:'📢', desc:'Promote your clinic to CareBridge users' },
                    { label:'Analytics',  href:'/clinic/analytics', icon:'📈', desc:'Track patient trends and ad performance' },
                  ].map(a=>(
                    <a key={a.label} href={a.href} className="bg-gray-900 border border-gray-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all group">
                      <div className="text-2xl mb-3">{a.icon}</div>
                      <div className="text-white font-semibold text-sm group-hover:text-emerald-400 transition-colors">{a.label}</div>
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
