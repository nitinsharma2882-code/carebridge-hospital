'use client';

// components/ProfilePage.tsx — Shared profile component for all admin panels
// Fetches real data from /api/{role}/me and saves via /api/{role}/profile

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getHospital, saveAuth, getToken, UserRole } from '@/lib/auth';

interface ExtraField { key: string; label: string; placeholder?: string; }

interface Props {
  role: UserRole;
  apiBase: string;      // e.g. '/api/corporate'
  extraFields?: ExtraField[];
}

export default function ProfilePage({ role, apiBase, extraFields = [] }: Props) {
  const [fields,   setFields]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(true);

  // Standard fields present for every role
  const STD = ['name', 'email', 'phone', 'city', 'address', 'website'];

  useEffect(() => {
    // 1. Load from localStorage immediately
    const cached = getHospital() as Record<string,string> | null;
    if (cached) {
      const init: Record<string,string> = {};
      [...STD, ...extraFields.map(f=>f.key)].forEach(k => { init[k] = cached[k] ?? ''; });
      setFields(init);
    }

    // 2. Fetch fresh from API
    api.get(`${apiBase}/me`)
      .then(r => {
        const data = r.data;
        const entity = data?.hospital ?? data?.corporate ?? data?.clinic ?? data?.pharma ?? data;
        if (entity) {
          const updated: Record<string,string> = {};
          [...STD, ...extraFields.map(f=>f.key)].forEach(k => { updated[k] = entity[k] ?? ''; });
          setFields(updated);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiBase]);

  const handleSave = async () => {
    if (!fields.name?.trim()) { setError('Name is required'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      const endpoint = `${apiBase}/profile`;
      const res = await api.put(endpoint, fields);
      const updated = res.data?.hospital ?? res.data?.corporate ?? res.data?.clinic ?? res.data?.pharma ?? res.data;
      if (updated) {
        const token = getToken() || '';
        saveAuth(token, { ...updated, role });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const set = (k: string, v: string) => setFields(prev => ({ ...prev, [k]: v }));

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0',
    borderRadius: 10, fontSize: 13, color: '#0F172A', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#475569',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  const name = fields.name || '';
  const initials = name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : role[0].toUpperCase();

  const ROLE_COLORS: Record<UserRole, string> = {
    hospital:       'linear-gradient(135deg,#0D9488,#065f52)',
    corporate:      'linear-gradient(135deg,#7C3AED,#4C1D95)',
    clinic:         'linear-gradient(135deg,#10b981,#059669)',
    pharmaceutical: 'linear-gradient(135deg,#f97316,#ea580c)',
    partner:        'linear-gradient(135deg,#0D9488,#065f52)',
  };

  return (
    <AuthGuard requiredRole={role}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar />
        <div style={{ marginLeft: 256, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar title="Profile" subtitle="Manage your account information" />

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading profile...</div>
            ) : (
              <div style={{ maxWidth: 720, margin: '0 auto' }}>

                {/* Avatar card */}
                <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 18, background: ROLE_COLORS[role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>{name || 'Your Name'}</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{fields.email}</div>
                    <div style={{ fontSize: 12, color: '#0D9488', fontWeight: 600, marginTop: 4, textTransform: 'capitalize' }}>CareBridge {role} Partner</div>
                  </div>
                </div>

                {/* Form */}
                <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Account Information</div>

                  {saved && <div style={{ background: '#DCFCE7', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#14532D', fontWeight: 600 }}>✅ Profile saved successfully!</div>}
                  {error && <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626', fontWeight: 600 }}>{error}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={lbl}>Name *</label>
                      <input style={inp} value={fields.name||''} onChange={e=>set('name',e.target.value)} placeholder="Your name" />
                    </div>
                    <div>
                      <label style={lbl}>Email (read only)</label>
                      <input style={{ ...inp, background: '#F8FAFC', color: '#94A3B8' }} value={fields.email||''} readOnly />
                    </div>
                    <div>
                      <label style={lbl}>Phone</label>
                      <input style={inp} value={fields.phone||''} onChange={e=>set('phone',e.target.value)} placeholder="+91 98765 43210" />
                    </div>
                    <div>
                      <label style={lbl}>City</label>
                      <input style={inp} value={fields.city||''} onChange={e=>set('city',e.target.value)} placeholder="e.g. New Delhi" />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={lbl}>Address</label>
                      <input style={inp} value={fields.address||''} onChange={e=>set('address',e.target.value)} placeholder="Full address" />
                    </div>
                    <div>
                      <label style={lbl}>Website</label>
                      <input style={inp} value={fields.website||''} onChange={e=>set('website',e.target.value)} placeholder="https://yoursite.com" />
                    </div>

                    {/* Extra role-specific fields */}
                    {extraFields.map(f => (
                      <div key={f.key}>
                        <label style={lbl}>{f.label}</label>
                        <input style={inp} value={fields[f.key]||''} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder||''} />
                      </div>
                    ))}
                  </div>

                  <button onClick={handleSave} disabled={saving}
                    style={{ padding: '12px 28px', background: saving ? '#94A3B8' : '#0D9488', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
