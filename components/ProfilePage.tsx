'use client';

// components/ProfilePage.tsx — Reusable profile/settings page for all roles

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';
import { getHospital, saveAuth, getToken, getRole, UserRole } from '@/lib/auth';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  website: string;
  [key: string]: string;
}

interface Props {
  role: UserRole;
  apiBase: string;
  extraFields?: { key: string; label: string; placeholder: string }[];
}

export default function ProfilePage({ role, apiBase, extraFields = [] }: Props) {
  const [form, setForm] = useState<ProfileData>({ name: '', email: '', phone: '', city: '', address: '', website: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(`${apiBase}/me`)
      .then(r => setForm({ ...form, ...r.data }))
      .catch(() => {
        const cached = getHospital() as ProfileData | null;
        if (cached) setForm(prev => ({ ...prev, ...cached }));
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await axios.put(`${apiBase}/profile`, form);
      const token = getToken() ?? '';
      saveAuth(token, { ...r.data, role: getRole() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {} finally { setSaving(false); }
  };

  const baseFields = [
    { key: 'name',    label: 'Organisation Name', placeholder: 'Full name' },
    { key: 'email',   label: 'Email',             placeholder: 'email@example.com' },
    { key: 'phone',   label: 'Phone',             placeholder: '+91 9000000000' },
    { key: 'city',    label: 'City',              placeholder: 'Mumbai' },
    { key: 'address', label: 'Address',           placeholder: 'Full address' },
    { key: 'website', label: 'Website',           placeholder: 'https://example.com' },
  ];

  const allFields = [...baseFields, ...extraFields];

  return (
    <AuthGuard requiredRole={role}>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Profile & Settings" subtitle="Manage your organisation's information" />
          <div className="p-6 max-w-2xl">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">

              {/* Avatar */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-800">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                  {form.name?.[0] ?? '?'}
                </div>
                <div>
                  <div className="text-white font-semibold text-lg">{form.name || '—'}</div>
                  <div className="text-gray-400 text-sm">{form.email || '—'}</div>
                  <div className="text-gray-500 text-xs mt-0.5 capitalize">{role} account</div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-4">
                {allFields.map(field => (
                  <div key={field.key} className={field.key === 'address' ? 'col-span-2' : ''}>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">{field.label}</label>
                    <input
                      value={form[field.key] ?? ''}
                      onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      disabled={loading || field.key === 'email'}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {saved && <span className="text-emerald-400 text-sm">✓ Saved successfully</span>}
              </div>

            </div>

            {/* Danger Zone */}
            <div className="bg-gray-900 rounded-2xl border border-red-900/40 p-5 mt-4">
              <h3 className="text-red-400 font-semibold text-sm mb-3">Danger Zone</h3>
              <p className="text-gray-400 text-sm mb-3">Contact CareBridge support to deactivate or delete your account.</p>
              <a href="mailto:support@carebridge.in" className="text-sm text-blue-400 hover:underline">
                support@carebridge.in
              </a>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
