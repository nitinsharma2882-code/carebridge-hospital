'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HospitalAPI } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true); setError('')
    try {
      const role = localStorage.getItem('cb_selected_role') || 'hospital'
      const loginMap: Record<string, () => Promise<any>> = {
        hospital:       () => HospitalAPI.login(email, password),
        corporate:      () => HospitalAPI.loginAs('corporate', email, password),
        clinic:         () => HospitalAPI.loginAs('clinic', email, password),
        pharmaceutical: () => HospitalAPI.loginAs('pharmaceutical', email, password),
      }
      const res = await (loginMap[role] ?? loginMap.hospital)()
      const userData = res.data.hospital ?? res.data.corporate ?? res.data.clinic ?? res.data.pharma ?? {}
      saveAuth(res.data.token, { ...userData, role })
      const redirectMap: Record<string, string> = {
        hospital:       '/dashboard',
        corporate:      '/corporate/dashboard',
        clinic:         '/clinic/dashboard',
        pharmaceutical: '/pharmaceutical/dashboard',
      }
      router.push(redirectMap[role] ?? '/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0',
    borderRadius: 12, fontSize: 14, color: '#0F172A', background: '#F8FAFC',
    outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0F172A,#134E4A)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>

        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#0D9488,#065f52)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(255,255,255,0.2)" stroke="#fff" strokeWidth="1.5"/>
                <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>CareBridge</div>
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Hospital Portal</div>
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px', marginTop: 16 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>Sign in to your hospital partner account</div>
        </div>

        {/* Form */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
          <input style={inp} type="email" placeholder="hospital@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
<input style={inp} type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoComplete="new-password" />        </div>

        {error && (
          <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: 16, background: loading ? '#94A3B8' : '#0D9488', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94A3B8' }}>
          Don&apos;t have an account? Contact CareBridge admin to get access.
        </div>
      </div>
    </div>
  )
}