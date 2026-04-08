'use client';

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  familyMembers: number;
  status: 'active' | 'inactive';
}

export default function CorporateEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/api/corporate/employees')
      .then(r => setEmployees(r.data?.employees ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      const r = await axios.post('/api/corporate/employees', form);
      setEmployees(prev => [r.data, ...prev]);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', department: '' });
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <TopBar
            title="Employee Management"
            subtitle="Manage employees and their family members"
            actions={
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition"
              >
                + Add Employee
              </button>
            }
          />

          <div className="p-6 space-y-4">
            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or department..."
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />

            {/* Table */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Name', 'Email', 'Department', 'Phone', 'Family', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-500">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-500">No employees found</td></tr>
                  ) : filtered.map(emp => (
                    <tr key={emp._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="px-5 py-3.5 text-white font-medium">{emp.name}</td>
                      <td className="px-5 py-3.5 text-gray-400">{emp.email}</td>
                      <td className="px-5 py-3.5 text-gray-300">{emp.department}</td>
                      <td className="px-5 py-3.5 text-gray-400">{emp.phone}</td>
                      <td className="px-5 py-3.5 text-gray-400">{emp.familyMembers ?? 0} members</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          emp.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-4">Add Employee</h2>
            <div className="space-y-3">
              {(['name', 'email', 'phone', 'department'] as const).map(field => (
                <input
                  key={field}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={form[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
