'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import AuthGuard from '@/components/AuthGuard'
import { HospitalAPI } from '@/lib/api'

interface Stats {
  total: number; completed: number; pending: number; cancelled: number; revenue: number
}

interface Booking {
  _id: string; serviceType: string; status: string
  fare: number; createdAt: string; hospital?: string
  destinationHospital?: string; userId?: { name?: string }
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(r => headers.map(h => String(r[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadPDF(title: string, lines: string[]) {
  const content = [title, '='.repeat(50), '', ...lines].join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/ /g, '-')}-${Date.now()}.txt`; a.click()
  URL.revokeObjectURL(url)
}

export default function AnalyticsPage() {
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [period,   setPeriod]   = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    Promise.all([HospitalAPI.getDashboard(), HospitalAPI.getBookings()]).then(([d, b]) => {
      if (d.data?.success) setStats(d.data.stats)
      if (b.data?.success) setBookings(b.data.bookings || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Filter by period
  const now = new Date()
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 9999
  const filtered = bookings.filter(b => {
    const diff = (now.getTime() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    return diff <= days
  })

  // Analytics from ads (serviceType filter)
  const fromAds  = filtered.filter(b => b.serviceType === 'general')
  const fromAsst = filtered.filter(b => ['opd_assistant', 'nursing'].includes(b.serviceType))
  const fromAmbu = filtered.filter(b => b.serviceType === 'ambulance')

  // Monthly trend
  const months: Record<string, number> = {}
  filtered.forEach(b => {
    const m = new Date(b.createdAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    months[m] = (months[m] || 0) + 1
  })
  const monthData = Object.entries(months).slice(-6)
  const maxMonth  = Math.max(...monthData.map(([,v]) => v), 1)

  // Service breakdown
  const svcBreakdown = [
    { label: 'OPD Assistant', count: filtered.filter(b => b.serviceType === 'opd_assistant').length, color: '#0D9488' },
    { label: 'Ambulance',     count: filtered.filter(b => b.serviceType === 'ambulance').length,     color: '#DC2626' },
    { label: 'Nursing Care',  count: filtered.filter(b => b.serviceType === 'nursing').length,       color: '#7C3AED' },
    { label: 'General',       count: filtered.filter(b => b.serviceType === 'general').length,       color: '#D97706' },
  ]
  const totalSvc = svcBreakdown.reduce((s, x) => s + x.count, 0) || 1

  const handleDownloadAdAnalyticsCSV = () => {
    const data = fromAds.map(b => ({
      BookingID: b._id.slice(-8).toUpperCase(),
      Service: b.serviceType, Status: b.status,
      Fare: b.fare, Date: new Date(b.createdAt).toLocaleDateString('en-IN'),
      Patient: b.userId?.name || 'N/A',
    }))
    downloadCSV(data, `ad-traffic-analytics-${Date.now()}.csv`)
  }

  const handleDownloadAdAnalyticsPDF = () => {
    downloadPDF('CareBridge Ad Traffic Analytics', [
      `Period: Last ${period}`,
      `Total from Ads: ${fromAds.length}`,
      `Completed: ${fromAds.filter(b => b.status === 'completed').length}`,
      `Revenue: Rs. ${fromAds.filter(b => b.status === 'completed').reduce((s, b) => s + b.fare, 0).toLocaleString()}`,
      '',
      ...fromAds.map((b, i) => `${i+1}. #${b._id.slice(-8).toUpperCase()} | ${b.status} | Rs.${b.fare} | ${new Date(b.createdAt).toLocaleDateString('en-IN')}`),
    ])
  }

  const handleDownloadAssistAnalyticsCSV = () => {
    const data = fromAsst.map(b => ({
      BookingID: b._id.slice(-8).toUpperCase(),
      Service: b.serviceType, Status: b.status,
      Fare: b.fare, Date: new Date(b.createdAt).toLocaleDateString('en-IN'),
      Patient: b.userId?.name || 'N/A',
    }))
    downloadCSV(data, `assistance-analytics-${Date.now()}.csv`)
  }

  const handleDownloadAssistAnalyticsPDF = () => {
    downloadPDF('CareBridge Assistance Traffic Analytics', [
      `Period: Last ${period}`,
      `Total via Assistance: ${fromAsst.length}`,
      `Completed: ${fromAsst.filter(b => b.status === 'completed').length}`,
      `Revenue: Rs. ${fromAsst.filter(b => b.status === 'completed').reduce((s, b) => s + b.fare, 0).toLocaleString()}`,
      '',
      ...fromAsst.map((b, i) => `${i+1}. #${b._id.slice(-8).toUpperCase()} | ${b.serviceType} | ${b.status} | Rs.${b.fare} | ${new Date(b.createdAt).toLocaleDateString('en-IN')}`),
    ])
  }

  const StatCard = ({ label, value, sub, color, bg }: { label: string; value: string | number; sub: string; color: string; bg: string }) => (
    <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #E2E8F0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 4, background: bg, display: 'inline-block', padding: '2px 8px', borderRadius: 20 }}>{sub}</div>
    </div>
  )

  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar />
        <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar
            title="Analytics"
            subtitle="Track traffic from CareBridge ads and assistance"
            actions={
              <div style={{ display: 'flex', gap: 6 }}>
                {(['7d','30d','90d','all'] as const).map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    style={{ padding: '6px 12px', background: period === p ? '#0D9488' : '#F1F5F9', color: period === p ? '#fff' : '#475569', border: period === p ? 'none' : '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    {p === 'all' ? 'All time' : `Last ${p}`}
                  </button>
                ))}
              </div>
            }
          />

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading analytics...</div>
            ) : (
              <>
                {/* Overall stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
                  <StatCard label="Total Patients" value={filtered.length}    sub="via CareBridge"    color="#0D9488" bg="#E0F7F5" />
                  <StatCard label="Completed"      value={filtered.filter(b=>b.status==='completed').length} sub={`${filtered.length ? Math.round(filtered.filter(b=>b.status==='completed').length/filtered.length*100) : 0}% rate`} color="#16A34A" bg="#DCFCE7" />
                  <StatCard label="Revenue"        value={`Rs.${filtered.filter(b=>b.status==='completed').reduce((s,b)=>s+b.fare,0).toLocaleString()}`} sub="from your hospital" color="#7C3AED" bg="#EDE9FE" />
                  <StatCard label="Avg Fare"       value={`Rs.${filtered.length ? Math.round(filtered.reduce((s,b)=>s+b.fare,0)/filtered.length) : 0}`} sub="per booking" color="#D97706" bg="#FEF3C7" />
                </div>

                {/* ANALYTICS 1: Traffic from Ads */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 20, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Traffic from Your Ads</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Patients who came after seeing your CareBridge advertisement</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleDownloadAdAnalyticsCSV}
                        style={{ padding: '7px 14px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                        CSV
                      </button>
                      <button onClick={handleDownloadAdAnalyticsPDF}
                        style={{ padding: '7px 14px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                        PDF
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
                      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#0D9488' }}>{fromAds.length}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Patients via Ads</div>
                      </div>
                      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#16A34A' }}>{fromAds.filter(b=>b.status==='completed').length}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Completed</div>
                      </div>
                      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#7C3AED' }}>Rs.{fromAds.filter(b=>b.status==='completed').reduce((s,b)=>s+b.fare,0).toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Revenue</div>
                      </div>
                    </div>
                    {fromAds.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8', fontSize: 13 }}>
                        No ad traffic data yet. Post an ad to start tracking.
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#64748B' }}>
                        {fromAds.length} patients discovered your hospital through CareBridge ads in the selected period.
                      </div>
                    )}
                  </div>
                </div>

                {/* ANALYTICS 2: Traffic from Assistance */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 20, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Traffic from Assistance Services</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Patients who came to your hospital via CareBridge OPD assistants</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleDownloadAssistAnalyticsCSV}
                        style={{ padding: '7px 14px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                        CSV
                      </button>
                      <button onClick={handleDownloadAssistAnalyticsPDF}
                        style={{ padding: '7px 14px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                        PDF
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
                      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#0D9488' }}>{fromAsst.length}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>via OPD Assistant</div>
                      </div>
                      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#DC2626' }}>{fromAmbu.length}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>via Ambulance</div>
                      </div>
                      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#16A34A' }}>{fromAsst.filter(b=>b.status==='completed').length}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Completed visits</div>
                      </div>
                    </div>

                    {/* Service breakdown bar chart */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Service Breakdown</div>
                      {svcBreakdown.map(s => (
                        <div key={s.label} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{s.label}</span>
                            <span style={{ fontSize: 12, color: '#0F172A', fontWeight: 700 }}>{s.count}</span>
                          </div>
                          <div style={{ background: '#F1F5F9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${(s.count/totalSvc)*100}%`, height: '100%', background: s.color, borderRadius: 6, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Monthly trend */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Monthly Patient Trend</div>
                  </div>
                  <div style={{ padding: 20 }}>
                    {monthData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8', fontSize: 13 }}>No data for selected period</div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
                        {monthData.map(([month, count]) => (
                          <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#0D9488' }}>{count}</div>
                            <div style={{ width: '100%', background: '#0D9488', borderRadius: '4px 4px 0 0', height: `${(count/maxMonth)*100}px`, minHeight: 4, transition: 'height 0.5s ease' }} />
                            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{month}</div>
                          </div>
                        ))}
                      </div>
                    )}
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