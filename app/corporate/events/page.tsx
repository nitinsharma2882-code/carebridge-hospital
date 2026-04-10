'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import { CorporateAPI } from '@/lib/api';

interface Event { _id:string; title:string; type:string; date:string; location?:string; capacity?:number; description?:string; status:string; }

const TYPE_ICONS: Record<string,string> = { health_camp:'🏕️', checkup:'🩺', vaccination:'💉', workshop:'📋', default:'🏥' };
const STATUS_CFG: Record<string,{label:string;cls:string}> = {
  upcoming: {label:'Upcoming', cls:'bg-blue-500/20 text-blue-400'},
  ongoing:  {label:'Ongoing',  cls:'bg-emerald-500/20 text-emerald-400'},
  completed:{label:'Done',     cls:'bg-gray-700 text-gray-400'},
  cancelled:{label:'Cancelled',cls:'bg-red-500/20 text-red-400'},
};

export default function CorporateEvents() {
  const [events,  setEvents]  = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ title:'', type:'health_camp', date:'', location:'', capacity:'100', description:'' });

  useEffect(() => {
    CorporateAPI.getEvents()
      .then(r => setEvents(r.data?.events ?? []))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      const r = await CorporateAPI.createEvent({ ...form, capacity: Number(form.capacity) } as Record<string,unknown>);
      setEvents(prev => [r.data, ...prev]);
      setShowAdd(false);
      setForm({ title:'', type:'health_camp', date:'', location:'', capacity:'100', description:'' });
    } catch { alert('Failed to create event'); }
    finally { setSaving(false); }
  };

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500";

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Health Events" subtitle="Manage corporate health camps and checkups" />
          <div className="p-6 space-y-4">
            <div className="flex justify-end">
              <button onClick={()=>setShowAdd(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition">+ Create Event</button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
                <div className="text-5xl mb-4">🏕️</div>
                <div className="text-white font-semibold text-lg mb-2">No events yet</div>
                <div className="text-gray-400 text-sm mb-6">Create your first health camp or checkup event</div>
                <button onClick={()=>setShowAdd(true)} className="px-6 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl">Create Event</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(ev => {
                  const sc = STATUS_CFG[ev.status] ?? STATUS_CFG.upcoming;
                  const icon = TYPE_ICONS[ev.type] ?? TYPE_ICONS.default;
                  return (
                    <div key={ev._id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{icon}</span>
                          <div>
                            <div className="text-white font-semibold">{ev.title}</div>
                            <div className="text-gray-500 text-xs mt-0.5 capitalize">{ev.type.replace('_',' ')}</div>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span>
                      </div>
                      <div className="space-y-1.5 text-sm text-gray-400">
                        <div>📅 {new Date(ev.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                        {ev.location && <div>📍 {ev.location}</div>}
                        {ev.capacity && <div>👥 Capacity: {ev.capacity}</div>}
                        {ev.description && <div className="text-gray-500 text-xs mt-2 line-clamp-2">{ev.description}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-base">Create Health Event</h2>
              <button onClick={()=>setShowAdd(false)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3">
              <input placeholder="Event Title *" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className={inp} />
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className={inp}>
                <option value="health_camp">Health Camp</option>
                <option value="checkup">General Checkup</option>
                <option value="vaccination">Vaccination Drive</option>
                <option value="workshop">Wellness Workshop</option>
              </select>
              <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className={inp} />
              <input placeholder="Location" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} className={inp} />
              <input type="number" placeholder="Capacity" value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:e.target.value}))} className={inp} />
              <textarea placeholder="Description (optional)" rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} className={`${inp} resize-none`} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition">Cancel</button>
              <button onClick={handleCreate} disabled={saving||!form.title||!form.date}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition disabled:opacity-50">
                {saving?'Creating...':'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
