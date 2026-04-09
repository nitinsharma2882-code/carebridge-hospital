'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import AuthGuard from '@/components/AuthGuard'
import api from '@/lib/api'
import { getHospital, saveAuth, getToken } from '@/lib/auth'

export default function ProfilePage() {
  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [phone,        setPhone]        = useState('')
  const [city,         setCity]         = useState('')
  const [address,      setAddress]      = useState('')
  const [website,      setWebsite]      = useState('')
  const [specialities, setSpecialities] = useState('')
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')
  const [loadError,    setLoadError]    = useState('')

  useEffect(() => {
    // 1. Load from localStorage immediately so form isn't blank
    const h = getHospital() as Record<string, unknown> | null
    if (h) {
      setName((h.name as string) || '')
      setEmail((h.email as string) || '')
      setPhone((h.phone as string) || '')
      setCity((h.city as string) || '')
      setAddress((h.address as string) || '')
      setWebsite((h.website as string) || '')
      setSpecialities(((h.specialities as string[]) || []).join(', '))
    }

    // 2. Fetch fresh data from API — works with both old ({success, hospital}) and new response formats
    api.get('/api/hospital/me')
      .then(res => {
        const data = res.data
        // Support both response formats: { success, hospital } or direct hospital object
        const h = data?.hospital ?? data
        if (h && (h.name || h.email)) {
          setName(h.name || '')
          setEmail(h.email || '')
          setPhone(h.phone || '')
          setCity(h.city || '')
          setAddress(h.address || '')
          setWebsite(h.website || '')
          setSpecialities((h.specialities || []).join(', '))
        }
      })
      .catch(() => {
        setLoadError('Could not refresh profile from server. Showing cached data.')
      })
  }, [])

  const handleSave = async () => {
    if (!name.trim()) { setError('Hospital name is required'); return }
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await api.put('/api/hospital/profile', {
        name, phone, city, address, website,
        specialities: specialities.split(',').map((s: string) => s.trim()).filter(Boolean),
      })
      const data = res.data
      // Support both response formats
      const updated = data?.hospital ?? data
      if (updated) {
        const token = getToken() || ''
        saveAuth(token, { ...updated, role: 'hospital' })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0',
    borderRadius: 10, fontSize: 13, color: '#0F172A', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#475569',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px',
  }

  const hospital = getHospital() as Record<string, unknown> | null
  const initials = name
    ? name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : hospital?.name
      ? (hospital.name as string).split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
      : 'H'

  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar />
        <div style={{ marginLeft: 256, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar title="Hospital Profile" subtitle="Manage your hospital information" />

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>

              {/* Load warning (non-critical) */}
              {loadError && (
                <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                  ⚠️ {loadError}
                </div>
              )}

              {/* Avatar */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg,#0D9488,#065f52)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>{name || 'Hospital Name'}</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{email}</div>
                  <div style={{ fontSize: 12, color: '#0D9488', fontWeight: 600, marginTop: 4 }}>CareBridge Hospital Partner</div>
                </div>
              </div>

              {/* Form */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Hospital Information</div>

                {saved && (
                  <div style={{ background: '#DCFCE7', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#14532D', fontWeight: 600 }}>
                    ✅ Profile saved successfully!
                  </div>
                )}
                {error && (
                  <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={lbl}>Hospital Name *</label>
                    <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AIIMS Delhi" />
                  </div>
                  <div>
                    <label style={lbl}>Email (read only)</label>
                    <input style={{ ...inp, background: '#F8FAFC', color: '#94A3B8' }} value={email} readOnly />
                  </div>
                  <div>
                    <label style={lbl}>Phone</label>
                    <input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label style={lbl}>City</label>
                    <input style={inp} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. New Delhi" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Full Address</label>
                    <input style={inp} value={address} onChange={e => setAddress(e.target.value)} placeholder="Hospital full address" />
                  </div>
                  <div>
                    <label style={lbl}>Website</label>
                    <input style={inp} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourhospital.com" />
                  </div>
                  <div>
                    <label style={lbl}>Specialities (comma separated)</label>
                    <input style={inp} value={specialities} onChange={e => setSpecialities(e.target.value)} placeholder="Cardiology, Neurology, Orthopedics" />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: '12px 28px', background: saving ? '#94A3B8' : '#0D9488', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
