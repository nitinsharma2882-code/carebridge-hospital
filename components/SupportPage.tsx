'use client';

// components/SupportPage.tsx — Reusable support/helpdesk page for all roles
// Usage: import and render inside each role's /support/page.tsx

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';
import { UserRole } from '@/lib/auth';

interface Ticket {
  _id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  lastReply: string;
}

const statusColors: Record<string, string> = {
  open:        'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-yellow-500/20 text-yellow-400',
  resolved:    'bg-emerald-500/20 text-emerald-400',
  closed:      'bg-gray-700 text-gray-400',
};

const priorityColors: Record<string, string> = {
  low:    'bg-gray-700 text-gray-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high:   'bg-red-500/20 text-red-400',
};

interface Props {
  role: UserRole;
  apiBase: string; // e.g. '/api/corporate' or '/api/clinic'
}

export default function SupportPage({ role, apiBase }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'general', priority: 'medium', message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${apiBase}/support`)
      .then(r => setTickets(r.data?.tickets ?? []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [apiBase]);

  const handleCreate = async () => {
    if (!form.subject || !form.message) return;
    setSaving(true);
    try {
      const r = await axios.post(`${apiBase}/support`, form);
      setTickets(prev => [r.data, ...prev]);
      setShowModal(false);
      setForm({ subject: '', category: 'general', priority: 'medium', message: '' });
    } catch {} finally { setSaving(false); }
  };

  return (
    <AuthGuard requiredRole={role}>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar
            title="Support & Helpdesk"
            subtitle="Raise and track support tickets"
            actions={
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
              >
                + New Ticket
              </button>
            }
          />
          <div className="p-6 space-y-4">

            {/* FAQ Quick Links */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { q: 'How do I update my profile?',     icon: '👤' },
                { q: 'Why is my ad pending approval?',  icon: '📢' },
                { q: 'How are bookings matched to me?', icon: '📋' },
              ].map(faq => (
                <div key={faq.q} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-gray-600 transition">
                  <span className="text-lg">{faq.icon}</span>
                  <span className="text-gray-300 text-sm">{faq.q}</span>
                </div>
              ))}
            </div>

            {/* Tickets Table */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-white font-semibold">My Tickets</h3>
                <span className="text-gray-400 text-sm">{tickets.length} total</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Subject', 'Category', 'Priority', 'Status', 'Last Update'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">Loading...</td></tr>
                  ) : tickets.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">No tickets yet — raise one if you need help</td></tr>
                  ) : tickets.map(t => (
                    <tr key={t._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="px-5 py-3.5 text-white font-medium">{t.subject}</td>
                      <td className="px-5 py-3.5 text-gray-400 capitalize">{t.category}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[t.priority]}`}>{t.priority}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status]}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">
                        {new Date(t.lastReply ?? t.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-lg space-y-3">
            <h2 className="text-white font-semibold text-lg mb-1">New Support Ticket</h2>
            <input
              placeholder="Subject"
              value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                {['general', 'billing', 'technical', 'ads', 'booking', 'other'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                {['low', 'medium', 'high'].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Describe your issue..."
              rows={4}
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50">
                {saving ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
