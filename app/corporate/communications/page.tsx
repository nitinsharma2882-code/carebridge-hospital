'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';

interface Message {
  _id: string;
  title: string;
  content: string;
  tag: string;
  sentToCount: number;
  createdAt: string;
  status: string;
}

const tagColors: Record<string, string> = {
  general:      'bg-gray-700 text-gray-300',
  health_camp:  'bg-emerald-500/20 text-emerald-400',
  emergency:    'bg-red-500/20 text-red-400',
  policy:       'bg-blue-500/20 text-blue-400',
  event:        'bg-violet-500/20 text-violet-400',
  reminder:     'bg-orange-500/20 text-orange-400',
};

const tagIcons: Record<string, string> = {
  general: '📢', health_camp: '🏕️', emergency: '🚨', policy: '📋', event: '🎯', reminder: '⏰',
};

export default function CorporateCommunications() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', tag: 'general' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [preview, setPreview] = useState<Message | null>(null);

  useEffect(() => {
    axios.get('/api/corporate/messages')
      .then(r => setMessages(r.data?.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSending(true);
    try {
      const r = await axios.post('/api/corporate/messages', form);
      setMessages(prev => [r.data.message, ...prev]);
      setSentCount(r.data.sentTo ?? 0);
      setSent(true);
      setForm({ title: '', content: '', tag: 'general' });
      setTimeout(() => { setSent(false); setShowCompose(false); }, 3000);
    } catch {} finally { setSending(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await axios.delete(`/api/corporate/messages/${id}`).catch(() => {});
    setMessages(prev => prev.filter(m => m._id !== id));
  };

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <TopBar
            title="Employee Communications"
            subtitle="Send announcements and updates to all employees"
            actions={
              <button
                onClick={() => setShowCompose(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition flex items-center gap-2"
              >
                ✉️ Compose Message
              </button>
            }
          />

          <div className="p-4 md:p-6 space-y-4">

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Sent',       value: messages.length,                                           icon: '📤' },
                { label: 'Total Reached',    value: messages.reduce((s, m) => s + (m.sentToCount ?? 0), 0),   icon: '👥' },
                { label: 'This Month',       value: messages.filter(m => new Date(m.createdAt).getMonth() === new Date().getMonth()).length, icon: '📅' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Messages list */}
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-900 rounded-2xl animate-pulse border border-gray-800"/>)}
              </div>
            ) : messages.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">✉️</div>
                <div className="text-white font-semibold text-lg mb-2">No messages yet</div>
                <div className="text-gray-400 text-sm mb-6">Send your first announcement to all employees</div>
                <button onClick={() => setShowCompose(true)} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition">
                  Compose Message
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(msg => (
                  <div key={msg._id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="text-2xl flex-shrink-0">{tagIcons[msg.tag] ?? '📢'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-white font-semibold">{msg.title}</div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagColors[msg.tag] ?? 'bg-gray-700 text-gray-300'}`}>
                              {msg.tag.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-gray-400 text-sm mt-1 line-clamp-2">{msg.content}</div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>👥 Sent to {msg.sentToCount} employees</span>
                            <span>🕐 {new Date(msg.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setPreview(msg)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition">
                          View
                        </button>
                        <button onClick={() => handleDelete(msg._id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Compose Announcement</h2>
              <button onClick={() => { setShowCompose(false); setSent(false); }} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>

            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <div className="text-white font-semibold text-lg">Message Sent!</div>
                <div className="text-gray-400 text-sm mt-2">Delivered to {sentCount} employees</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tag */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2">Message Type</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'general', label: 'General', icon: '📢' },
                      { value: 'health_camp', label: 'Health Camp', icon: '🏕️' },
                      { value: 'emergency', label: 'Emergency', icon: '🚨' },
                      { value: 'policy', label: 'Policy', icon: '📋' },
                      { value: 'event', label: 'Event', icon: '🎯' },
                      { value: 'reminder', label: 'Reminder', icon: '⏰' },
                    ].map(t => (
                      <button
                        key={t.value}
                        onClick={() => setForm(p => ({ ...p, tag: t.value }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                          form.tag === t.value
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Title *</label>
                  <input
                    placeholder="e.g. Annual Health Camp on 15th April"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Message *</label>
                  <textarea
                    placeholder="Write your message to employees..."
                    rows={5}
                    value={form.content}
                    onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                {/* Preview */}
                {(form.title || form.content) && (
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <div className="text-gray-400 text-xs mb-2">Preview</div>
                    <div className="text-white font-medium text-sm">{form.title || 'Title'}</div>
                    <div className="text-gray-300 text-sm mt-1">{form.content || 'Content'}</div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowCompose(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!form.title.trim() || !form.content.trim() || sending}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? 'Sending...' : '📤 Send to All Employees'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagColors[preview.tag]}`}>
                {tagIcons[preview.tag]} {preview.tag.replace('_', ' ')}
              </span>
              <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            <h3 className="text-white font-bold text-lg mb-3">{preview.title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{preview.content}</p>
            <div className="mt-5 pt-4 border-t border-gray-800 flex justify-between text-xs text-gray-500">
              <span>👥 {preview.sentToCount} employees</span>
              <span>{new Date(preview.createdAt).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
