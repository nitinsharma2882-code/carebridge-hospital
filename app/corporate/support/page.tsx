'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState, useRef } from 'react';
import axios from '@/lib/api';

interface Ticket { _id: string; subject: string; category: string; status: string; priority: string; createdAt: string; lastReply: string; }
interface ChatMsg { from: 'user' | 'bot'; text: string; time: string; }

const statusColors: Record<string,string> = { open:'bg-blue-500/20 text-blue-400', in_progress:'bg-yellow-500/20 text-yellow-400', resolved:'bg-emerald-500/20 text-emerald-400', closed:'bg-gray-700 text-gray-400' };
const priorityColors: Record<string,string> = { low:'bg-gray-700 text-gray-400', medium:'bg-yellow-500/20 text-yellow-400', high:'bg-red-500/20 text-red-400' };

const BOT_RESPONSES: Record<string, string> = {
  'billing':     'For billing issues, go to Billing & Subscription page and click "View" on any invoice. If you see a discrepancy, raise a ticket and our team will resolve it within 24 hours.',
  'employee':    'To add employees, go to Employee Management → click "+ Add Employee" or upload a CSV file. Each employee will get access to CareBridge services immediately.',
  'booking':     'Bookings made by your employees appear automatically in the Bookings page. Filter by status to track active, completed, or cancelled visits.',
  'plan':        'To upgrade your plan, go to Billing & Subscription → click "Upgrade Plan". You can choose from Starter, Professional, Business, or Enterprise plans.',
  'event':       'To create a health event, go to Health Events → click "+ Create Event". You can schedule camps, checkups, workshops, and vaccinations.',
  'support':     'Our support team is available Mon–Sat, 9AM–6PM IST. For urgent issues, use this live chat or email support@carebridge.in.',
  'default':     'Thanks for reaching out! I can help with billing, employee management, bookings, plan upgrades, and health events. What do you need help with?',
};

function getBotReply(msg: string): string {
  const lower = msg.toLowerCase();
  for (const [key, reply] of Object.entries(BOT_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) return reply;
  }
  return BOT_RESPONSES.default;
}

export default function CorporateSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'general', priority: 'medium', message: '' });
  const [saving, setSaving] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { from: 'bot', text: '👋 Hi! I\'m the CareBridge support assistant. How can I help you today? Ask me about billing, employees, bookings, or health events.', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [botTyping, setBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get('/api/corporate/support')
      .then(r => setTickets(r.data?.tickets ?? []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs, botTyping]);

  const handleCreateTicket = async () => {
    if (!form.subject || !form.message) return;
    setSaving(true);
    try {
      const r = await axios.post('/api/corporate/support', form);
      setTickets(prev => [r.data, ...prev]);
      setShowTicketModal(false);
      setForm({ subject: '', category: 'general', priority: 'medium', message: '' });
    } catch {} finally { setSaving(false); }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMsg = { from: 'user', text: chatInput, time: now };
    setChatMsgs(prev => [...prev, userMsg]);
    setChatInput('');
    setBotTyping(true);
    setTimeout(() => {
      const reply = getBotReply(userMsg.text);
      setBotTyping(false);
      setChatMsgs(prev => [...prev, { from: 'bot', text: reply, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1200 + Math.random() * 800);
  };

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <TopBar title="Support & Helpdesk" subtitle="Raise tickets or chat with our support team"
            actions={
              <div className="flex gap-2">
                <button onClick={() => setShowChat(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition flex items-center gap-2">
                  💬 Live Chat
                </button>
                <button onClick={() => setShowTicketModal(true)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition">
                  + New Ticket
                </button>
              </div>
            }
          />

          <div className="p-4 md:p-6 space-y-4">
            {/* FAQ Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { q: 'How do I add employees?',      icon: '👥' },
                { q: 'Why is my invoice pending?',   icon: '💳' },
                { q: 'How to schedule health camp?', icon: '🏕️' },
              ].map(faq => (
                <div key={faq.q} onClick={() => { setShowChat(true); setTimeout(() => { setChatInput(faq.q); }, 100); }}
                  className="bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer transition">
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead><tr className="border-b border-gray-800">{['Subject','Category','Priority','Status','Last Update'].map(h=><th key={h} className="text-left px-5 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={5} className="text-center py-10 text-gray-500">Loading...</td></tr>
                    : tickets.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-500">No tickets yet — raise one or use Live Chat for quick help</td></tr>
                    : tickets.map(t => (
                      <tr key={t._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                        <td className="px-5 py-3.5 text-white font-medium">{t.subject}</td>
                        <td className="px-5 py-3.5 text-gray-400 capitalize">{t.category}</td>
                        <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[t.priority]}`}>{t.priority}</span></td>
                        <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status]}`}>{t.status.replace('_',' ')}</span></td>
                        <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{new Date(t.lastReply ?? t.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* New Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-lg space-y-3">
            <h2 className="text-white font-semibold text-lg mb-1">New Support Ticket</h2>
            <input placeholder="Subject" value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"/>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500">
                {['general','billing','technical','ads','booking','other'].map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
              <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500">
                {['low','medium','high'].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
            <textarea placeholder="Describe your issue..." rows={4} value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"/>
            <div className="flex gap-3 pt-1">
              <button onClick={()=>setShowTicketModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition">Cancel</button>
              <button onClick={handleCreateTicket} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50">
                {saving?'Submitting...':'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Chat Widget */}
      {showChat && (
        <div className="fixed bottom-4 right-4 w-80 sm:w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col" style={{ height: '480px' }}>
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">🤝</div>
              <div>
                <div className="text-white font-semibold text-sm">CareBridge Support</div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"/><span className="text-emerald-200 text-xs">Online now</span></div>
              </div>
            </div>
            <button onClick={()=>setShowChat(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMsgs.map((msg, i) => (
              <div key={i} className={`flex ${msg.from==='user'?'justify-end':'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.from==='user'?'bg-violet-600 text-white rounded-br-sm':'bg-gray-800 text-gray-200 rounded-bl-sm'}`}>
                  <div>{msg.text}</div>
                  <div className={`text-xs mt-1 ${msg.from==='user'?'text-violet-200':'text-gray-500'}`}>{msg.time}</div>
                </div>
              </div>
            ))}
            {botTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{animationDelay:'0ms'}}/>
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{animationDelay:'150ms'}}/>
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{animationDelay:'300ms'}}/>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendChat()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <button onClick={sendChat} disabled={!chatInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-40">
                Send
              </button>
            </div>
            <div className="text-center text-gray-600 text-xs mt-2">For complex issues, raise a support ticket</div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
