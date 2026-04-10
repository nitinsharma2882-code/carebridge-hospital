'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import { CorporateAPI } from '@/lib/api';

interface Employee {
  _id: string; name: string; email: string; phone?: string;
  department?: string; employeeCode?: string; corporateEmail?: string;
  status: string; createdAt: string;
}

export default function CorporateEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ name:'', email:'', phone:'', department:'', employeeCode:'' });
  const [deleting,  setDeleting]  = useState<string|null>(null);

  const load = () => {
    setLoading(true);
    CorporateAPI.getEmployees()
      .then(r => setEmployees(r.data?.employees ?? r.data ?? []))
      .catch(() => setError('Failed to load employees'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      const r = await CorporateAPI.addEmployee(form as Record<string,unknown>);
      setEmployees(prev => [r.data, ...prev]);
      setShowAdd(false);
      setForm({ name:'', email:'', phone:'', department:'', employeeCode:'' });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message ?? 'Failed to add employee');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this employee?')) return;
    setDeleting(id);
    try {
      await CorporateAPI.deleteEmployee(id);
      setEmployees(prev => prev.filter(e => e._id !== id));
    } catch { alert('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const filtered = employees.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || (e.department||'').toLowerCase().includes(q);
  });

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500";

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Employees" subtitle={`${employees.length} employees registered`} />
          <div className="p-6 space-y-4">

            {/* Toolbar */}
            <div className="flex gap-3 items-center">
              <input placeholder="Search by name, email or department..." value={search} onChange={e=>setSearch(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 flex-1 max-w-md" />
              <button onClick={()=>setShowAdd(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition">+ Add Employee</button>
            </div>

            {error   && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

            {/* Table */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading employees...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">👥</div>
                  <div className="text-white font-semibold mb-2">No employees yet</div>
                  <div className="text-gray-500 text-sm mb-5">Add your first employee to get started</div>
                  <button onClick={()=>setShowAdd(true)} className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl">+ Add Employee</button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Name','Email','Phone','Department','Code','Corporate Email','Status','Action'].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filtered.map(emp => (
                      <tr key={emp._id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{emp.name}</td>
                        <td className="px-4 py-3 text-gray-400">{emp.email}</td>
                        <td className="px-4 py-3 text-gray-400">{emp.phone||'—'}</td>
                        <td className="px-4 py-3 text-gray-400">{emp.department||'—'}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{emp.employeeCode||'—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{emp.corporateEmail||'—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${emp.status==='active'?'bg-emerald-500/20 text-emerald-400':'bg-gray-700 text-gray-400'}`}>{emp.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={()=>handleDelete(emp._id)} disabled={deleting===emp._id}
                            className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-lg transition">
                            {deleting===emp._id?'...':'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-base">Add Employee</h2>
              <button onClick={()=>setShowAdd(false)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3">
              <input placeholder="Full Name *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className={inp} />
              <input placeholder="Email *" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} className={inp} />
              <input placeholder="Phone" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} className={inp} />
              <input placeholder="Department" value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))} className={inp} />
              <input placeholder="Employee Code" value={form.employeeCode} onChange={e=>setForm(p=>({...p,employeeCode:e.target.value}))} className={inp} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition">Cancel</button>
              <button onClick={handleAdd} disabled={saving||!form.name||!form.email}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition disabled:opacity-50">
                {saving?'Adding...':'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
