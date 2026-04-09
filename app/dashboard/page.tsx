'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import AuthGuard from '@/components/AuthGuard'
import { HospitalAPI } from '@/lib/api'

interface Stats {
  total: number; completed: number; pending: number
  cancelled: number; revenue: number; adsApproved: number; adsPending: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    HospitalAPI.getDashboard().then(res => {
      if (res.data?.success) setStats(res.data.stats)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { label: 'Total Patients',  value: stats.total,        color: '#0D9488', bg: '#E0F7F5', change: 'via CareBridge' },
    { label: 'Completed',       value: stats.completed,    color: '#16A34A', bg: '#DCFCE7', change: `${stats.total ? Math.round(stats.completed/stats.total*100) : 0}% completion` },
    { label: 'Pending',         value: stats.pending,      color: '#D97706', bg: '#FEF3C7', change: 'awaiting service' },
    { label: 'Active Ads',      value: stats.adsApproved,  color: '#7C3AED', bg: '#EDE9FE', change: `${stats.adsPending} pending review` },
  ] : []

  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar />
        <div style={{ marginLeft: 256, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar
            title="Dashboard"
            actions={
              <>
                <button onClick={() => router.push('/bookings')}
                  style={{ padding: '8px 16px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  View Bookings
                </button>
                <button onClick={() => router.push('/ads')}
                  style={{ padding: '8px 16px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  + Post Ad
                </button>
              </>
            }
          />

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading dashboard...</div>
            ) : (
              <>
                {/* Stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
                  {cards.map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', letterSpacing: '-1px' }}>{c.value}</div>
                      <div style={{ fontSize: 12, color: c.color, fontWeight: 600, marginTop: 4 }}>{c.change}</div>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                  <div onClick={() => router.push('/analytics')}
                    style={{ background: 'linear-gradient(135deg,#0D9488,#065f52)', borderRadius: 16, padding: 24, cursor: 'pointer', color: '#fff' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Analytics</div>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>View Traffic</div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>See how many patients come from CareBridge ads and assistance</div>
                  </div>
                  <div onClick={() => router.push('/ads')}
                    style={{ background: 'linear-gradient(135deg,#4C1D95,#7C3AED)', borderRadius: 16, padding: 24, cursor: 'pointer', color: '#fff' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Advertise</div>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>Post an Ad</div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>Reach thousands of CareBridge users with your services</div>
                  </div>
                </div>

                {/* Info cards */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, marginBottom: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>How CareBridge Works for Your Hospital</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                    {[
                      { step: '1', title: 'Patient books', desc: 'Consumer books an OPD assistant or ambulance on the CareBridge app', color: '#0D9488' },
                      { step: '2', title: 'Partner assists', desc: 'A CareBridge partner guides the patient to your hospital for their appointment', color: '#7C3AED' },
                      { step: '3', title: 'You track it', desc: 'Every patient that mentions your hospital appears in your Bookings dashboard', color: '#D97706' },
                    ].map(s => (
                      <div key={s.step} style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{s.step}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}