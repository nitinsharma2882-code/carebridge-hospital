'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';

interface Notif {
  _id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const typeIcon: Record<string, string> = {
  booking: '📋',
  billing: '💳',
  event: '🏕️',
  alert: '🔔',
  announcement: '📢',
};

const typeBg: Record<string, string> = {
  booking:      'bg-blue-500/10 border-blue-500/20',
  billing:      'bg-violet-500/10 border-violet-500/20',
  event:        'bg-emerald-500/10 border-emerald-500/20',
  alert:        'bg-red-500/10 border-red-500/20',
  announcement: 'bg-orange-500/10 border-orange-500/20',
};

// Fallback static notifications if API has none
const STATIC_NOTIFS: Notif[] = [
  { _id: 'n1', title: 'Health Camp Reminder', body: 'Your scheduled camp is in 3 days. Make sure employees are informed.', type: 'event', read: false, createdAt: new Date().toISOString() },
  { _id: 'n2', title: 'Invoice Generated', body: 'Your April invoice of ₹3,499 is ready for download.', type: 'billing', read: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: 'n3', title: 'New Booking', body: 'Employee Ramesh Kumar has booked an OPD visit at AIIMS Delhi.', type: 'booking', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { _id: 'n4', title: 'Platform Announcement', body: 'CareBridge has launched telemedicine services. Your employees can now consult doctors online.', type: 'announcement', read: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
  { _id: 'n5', title: 'Subscription Renewal', body: 'Your Professional plan renews in 7 days. No action needed.', type: 'billing', read: true, createdAt: new Date(Date.now() - 345600000).toISOString() },
];

export default function CorporateNotifications() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    axios.get('/api/corporate/notifications')
      .then(r => {
        const data = r.data?.notifications ?? [];
        setNotifs(data.length > 0 ? data : STATIC_NOTIFS);
      })
      .catch(() => setNotifs(STATIC_NOTIFS))
      .finally(() => setLoading(false));
  }, []);

  const markRead = (id: string) => {
    axios.put(`/api/corporate/notifications/${id}/read`).catch(() => {});
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifs.filter(n => !n.read).length;
  const filtered = filter === 'unread' ? notifs.filter(n => !n.read) : notifs;

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <TopBar
            title="Notifications"
            subtitle="Announcements and alerts for your organisation"
            actions={
              unreadCount > 0 ? (
                <button
                  onClick={markAllRead}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition"
                >
                  Mark all read
                </button>
              ) : undefined
            }
          />

          <div className="p-4 md:p-6 space-y-4 max-w-2xl w-full">

            {/* Filter tabs */}
            <div className="flex gap-2">
              {(['all', 'unread'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
                    filter === f
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {f === 'unread' ? `Unread (${unreadCount})` : 'All'}
                </button>
              ))}
            </div>

            {/* Notifications list */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-900 rounded-2xl animate-pulse border border-gray-800" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-4xl mb-3">🔔</div>
                <div className="text-sm">No {filter === 'unread' ? 'unread ' : ''}notifications</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(n => (
                  <div
                    key={n._id}
                    onClick={() => !n.read && markRead(n._id)}
                    className={`border rounded-2xl p-4 flex gap-4 transition cursor-pointer ${
                      n.read
                        ? 'bg-gray-900 border-gray-800 opacity-70'
                        : `${typeBg[n.type] ?? 'bg-gray-900 border-gray-700'} hover:opacity-90`
                    }`}
                  >
                    <div className="text-2xl flex-shrink-0">{typeIcon[n.type] ?? '🔔'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-white font-medium text-sm">{n.title}</div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <div className="text-gray-400 text-sm mt-0.5 leading-snug">{n.body}</div>
                      <div className="text-gray-600 text-xs mt-1.5">
                        {new Date(n.createdAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
