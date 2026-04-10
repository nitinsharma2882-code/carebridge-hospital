'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import { CorporateAPI } from '@/lib/api';

interface Notif { _id:string; title:string; body:string; type:string; read:boolean; createdAt:string; }

const TYPE_ICON: Record<string,string> = { event:'🏕️', billing:'💳', employee:'👥', booking:'📋', default:'🔔' };

export default function CorporateNotifications() {
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<'all'|'unread'>('all');

  useEffect(() => {
    CorporateAPI.getNotifications()
      .then(r => setNotifs(r.data?.notifications ?? []))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    try {
      await CorporateAPI.markNotifRead(id);
      setNotifs(prev => prev.map(n => n._id===id ? {...n,read:true} : n));
    } catch {}
  };

  const markAllRead = () => notifs.filter(n=>!n.read).forEach(n=>markRead(n._id));

  const filtered = notifs.filter(n => filter==='all' || !n.read);
  const unreadCount = notifs.filter(n=>!n.read).length;

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Notifications" subtitle={`${unreadCount} unread notification${unreadCount!==1?'s':''}`} />
          <div className="p-6 space-y-4">

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {(['all','unread'] as const).map(f=>(
                  <button key={f} onClick={()=>setFilter(f)}
                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition capitalize ${filter===f?'bg-violet-600 text-white':'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}>
                    {f} {f==='unread'&&unreadCount>0?`(${unreadCount})`:''}
                  </button>
                ))}
              </div>
              {unreadCount>0&&<button onClick={markAllRead} className="text-sm text-violet-400 hover:text-violet-300 transition">Mark all read</button>}
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
              ) : filtered.length===0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">🔔</div>
                  <div className="text-white font-semibold mb-2">No notifications</div>
                  <div className="text-gray-500 text-sm">You're all caught up!</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {filtered.map(n=>(
                    <div key={n._id} onClick={()=>!n.read&&markRead(n._id)}
                      className={`px-6 py-4 flex gap-4 items-start cursor-pointer hover:bg-gray-800/50 transition ${!n.read?'':'opacity-60'}`}>
                      <div className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type]??TYPE_ICON.default}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-white font-medium text-sm">{n.title}</div>
                          {!n.read&&<div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0"/>}
                        </div>
                        <div className="text-gray-400 text-sm mt-0.5">{n.body}</div>
                        <div className="text-gray-600 text-xs mt-1">{new Date(n.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
