'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';

interface Booking {
  _id: string;
  employeeName: string;
  service: string;
  date: string;
  status: 'active' | 'completed' | 'cancelled';
  hospital?: string;
  amount?: number;
}

// Fallback demo data
const DEMO_BOOKINGS: Booking[] = [
  { _id: 'b1', employeeName: 'Ramesh Kumar',  service: 'OPD Visit',    date: new Date().toISOString(),                      status: 'active',    hospital: 'AIIMS Delhi',        amount: 500  },
  { _id: 'b2', employeeName: 'Priya Sharma',  service: 'Lab Test',     date: new Date(Date.now()-86400000).toISOString(),   status: 'completed', hospital: 'Max Hospital',       amount: 1200 },
  { _id: 'b3', employeeName: 'Suresh Mehta',  service: 'Ambulance',    date: new Date(Date.now()-172800000).toISOString(),  status: 'completed', hospital: 'Apollo Hospitals',   amount: 3000 },
  { _id: 'b4', employeeName: 'Anita Singh',   service: 'OPD Visit',    date: new Date(Date.now()-259200000).toISOString(),  status: 'cancelled', hospital: 'Fortis Healthcare',  amount: 500  },
  { _id: 'b5', employeeName: 'Vikram Gupta',  service: 'Nursing Care', date: new Date(Date.now()-345600000).toISOString(),  status: 'completed', hospital: 'AIIMS Delhi',        amount: 2500 },
];

const statusColor: Record<string, string> = {
  active:    'bg-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default function CorporateBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);

  useEffect(() => {
    axios.get('/api/corporate/bookings')
      .then(r => {
        const data = r.data?.bookings ?? [];
        setBookings(data.length > 0 ? data : DEMO_BOOKINGS);
      })
      .catch(() => setBookings(DEMO_BOOKINGS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings
    .filter(b => tab === 'all' || b.status === tab)
    .filter(b =>
      b.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      b.service?.toLowerCase().includes(search.toLowerCase()) ||
      b.hospital?.toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    all:       bookings.length,
    active:    bookings.filter(b => b.status === 'active').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Bookings Overview" subtitle="All employee healthcare bookings via CareBridge" />

          <div className="p-4 md:p-6 space-y-4">

            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by employee, service, or hospital..."
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'active', 'completed', 'cancelled'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
                    tab === t
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {t} ({counts[t]})
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Employee', 'Service', 'Hospital', 'Date', 'Amount', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-500">No bookings found</td></tr>
                  ) : filtered.map(b => (
                    <tr key={b._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="px-5 py-3.5 text-white font-medium whitespace-nowrap">{b.employeeName}</td>
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{b.service}</td>
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{b.hospital ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                        {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 text-white font-medium whitespace-nowrap">
                        {b.amount ? `₹${b.amount.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[b.status] ?? 'bg-gray-700 text-gray-400'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setSelected(b)}
                          className="text-violet-400 hover:text-violet-300 text-xs transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Booking Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Employee',  value: selected.employeeName },
                { label: 'Service',   value: selected.service },
                { label: 'Hospital',  value: selected.hospital ?? '—' },
                { label: 'Date',      value: new Date(selected.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Amount',    value: selected.amount ? `₹${selected.amount.toLocaleString()}` : '—' },
                { label: 'Status',    value: selected.status },
                { label: 'Booking ID', value: selected._id },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-400 text-sm">{row.label}</span>
                  <span className="text-white text-sm font-medium capitalize">{row.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-full mt-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
