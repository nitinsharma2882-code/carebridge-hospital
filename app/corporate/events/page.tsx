'use client';

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';

interface HealthEvent {
  _id: string;
  title: string;
  type: 'camp' | 'checkup' | 'workshop' | 'vaccination';
  date: string;
  location: string;
  registrations: number;
  capacity: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

const typeColors: Record<string, string> = {
  camp: 'bg-blue-500/20 text-blue-400',
  checkup: 'bg-emerald-500/20 text-emerald-400',
  workshop: 'bg-violet-500/20 text-violet-400',
  vaccination: 'bg-orange-500/20 text-orange-400',
};

const statusColors: Record<string, string> = {
  upcoming: 'bg-blue-500/20 text-blue-400',
  ongoing: 'bg-emerald-500/20 text-emerald-400',
  completed: 'bg-gray-700 text-gray-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default function CorporateEvents() {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'camp', date: '', location: '', capacity: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/api/corporate/events')
      .then(r => setEvents(r.data?.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      const r = await axios.post('/api/corporate/events', form);
      setEvents(prev => [r.data, ...prev]);
      setShowModal(false);
    } catch {} finally { setSaving(false); }
  };

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <TopBar
            title="Health Events"
            subtitle="Create and manage employee health camps & checkups"
            actions={
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition"
              >
                + Create Event
              </button>
            }
          />

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-3 text-center py-20 text-gray-500">Loading...</div>
            ) : events.length === 0 ? (
              <div className="col-span-3 text-center py-20 text-gray-500">
                No events yet — create your first health event
              </div>
            ) : events.map(ev => (
              <div key={ev._id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[ev.type]}`}>
                    {ev.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ev.status]}`}>
                    {ev.status}
                  </span>
                </div>
                <div className="text-white font-semibold">{ev.title}</div>
                <div className="text-gray-400 text-sm">📅 {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                <div className="text-gray-400 text-sm">📍 {ev.location}</div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-400 text-sm">{ev.registrations}/{ev.capacity} registered</div>
                  <div className="flex-1 mx-3 bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-violet-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (ev.registrations / ev.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md space-y-3">
            <h2 className="text-white font-semibold text-lg mb-2">Create Health Event</h2>
            <input placeholder="Event Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500" />
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500">
              {['camp', 'checkup', 'workshop', 'vaccination'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
            <input placeholder="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500" />
            <input type="number" placeholder="Capacity" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500" />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
