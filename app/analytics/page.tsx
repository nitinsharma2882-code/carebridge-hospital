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

const StatCard = ({ label, value, sub, color, bg }: { label: string; value: string | number; sub: string; color: string; bg: string }) => (
  <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #E2E8F0' }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>{value}</div>
    <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 4, background: bg, display: 'inline-block', padding: '2px 8px', borderRadius: 20 }}>{sub}</div>
  </div>
)

// Donut chart using SVG
function DonutChart({ segments, size = 120 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = 40; const cx = size / 2; const cy = size / 2
  let offset = 0
  const circumference = 2 * Math.PI * r

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={16} />
        {segments.map((seg, i) => {
          const pct = seg.value / total
          const dash = pct * circumference
          const gap = circumference - dash
          const rotation = offset * 360 - 90
          offset += pct
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={16}
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          )
        })}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="900" fill="#0F172A">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8" fill="#94A3B8">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#475569' }}>{seg.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginLeft: 'auto' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Line chart using SVG
function LineChart({ data, color = '#0D9488', height = 80 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 300; const h = height
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * (h - 10) - 5
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {/* Area fill */}
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill="url(#lineGrad)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - (v / max) * (h - 10) - 5
        return <circle key={i} cx={x} cy={y} r="4" fill={color} stroke="#fff" strokeWidth="2" />
      })}
    </svg>
  )
}

export default function AnalyticsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [period,   setPeriod]   = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    Promise.all([HospitalAPI.getDashboard(), HospitalAPI.getBookings()]).then(([d, b]) => {
      const bData = b.data?.bookings || b.data?.data || []
      setBookings(bData)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 9999
  const filtered = bookings.filter(b => {
    const diff = (now.getTime() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    return diff <= days
  })

  const fromAds  = filtered.filter(b => b.serviceType === 'general')
  const fromAsst = filtered.filter(b => ['opd_assistant', 'nursing'].includes(b.serviceType))
  const fromAmbu = filtered.filter(b => b.serviceType === 'ambulance')

  // Monthly trend — last 6 months
  const months: Record<string, number> = {}
  filtered.forEach(b => {
    const m = new Date(b.createdAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    months[m] = (months[m] || 0) + 1
  })
  const monthData = Object.entries(months).slice(-6)
  const maxMonth  = Math.max(...monthData.map(([,v]) => v), 1)

  // Weekly trend — last 7 days for line chart
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return filtered.filter(b => {
      const bd = new Date(b.createdAt)
      return bd.toDateString() === d.toDateString()
    }).length
  })

  // Status breakdown for donut
  const statusSegments = [
    { label: 'Completed',   value: filtered.filter(b => b.status === 'completed').length,   color: '#16A34A' },
    { label: 'In Progress', value: filtered.filter(b => b.status === 'in_progress').length, color: '#0D9488' },
    { label: 'Pending',     value: filtered.filter(b => b.status === 'pending').length,     color: '#D97706' },
    { label: 'Cancelled',   value: filtered.filter(b => b.status === 'cancelled').length,   color: '#DC2626' },
  ].filter(s => s.value > 0)

  // Service breakdown
  const svcBreakdown = [
    { label: 'OPD Assistant', count: filtered.filter(b => b.serviceType === 'opd_assistant').length, color: '#0D9488' },
    { label: 'Ambulance',     count: filtered.filter(b => b.serviceType === 'ambulance').length,     color: '#DC2626' },
    { label: 'Nursing Care',  count: filtered.filter(b => b.serviceType === 'nursing').length,       color: '#7C3AED' },
    { label: 'General',       count: filtered.filter(b => b.serviceType === 'general').length,       color: '#D97706' },
  ]
  const totalSvc = svcBreakdown.reduce((s, x) => s + x.count, 0) || 1

  const handleDownloadAdAnalyticsCSV = () => {
    downloadCSV(fromAds.map(b => ({ BookingID: b._id.slice(-8).toUpperCase(), Service: b.serviceType, Status: b.status, Fare: b.fare, Date: new Date(b.createdAt).toLocaleDateString('en-IN'), Patient: b.userId?.name || 'N/A' })), `ad-traffic-analytics-${Date.now()}.csv`)
  }
  const handleDownloadAdAnalyticsPDF = () => {
    downloadPDF('CareBridge Ad Traffic Analytics', [`Period: Last ${period}`, `Total from Ads: ${fromAds.length}`, `Completed: ${fromAds.filter(b => b.status === 'completed').length}`, `Revenue: Rs. ${fromAds.filter(b => b.status === 'completed').reduce((s, b) => s + b.fare, 0).toLocaleString()}`])
  }
  const handleDownloadAssistAnalyticsCSV = () => {
    downloadCSV(fromAsst.map(b => ({ BookingID: b._id.slice(-8).toUpperCase(), Service: b.serviceType, Status: b.status, Fare: b.fare, Date: new Date(b.createdAt).toLocaleDateString('en-IN'), Patient: b.userId?.name || 'N/A' })), `assistance-analytics-${Date.now()}.csv`)
  }
  const handleDownloadAssistAnalyticsPDF = () => {
    downloadPDF('CareBridge Assistance Traffic Analytics', [`Period: Last ${period}`, `Total via Assistance: ${fromAsst.length}`, `Completed: ${fromAsst.filter(b => b.status === 'completed').length}`])
  }

  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar />
        <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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

                {/* ── NEW: Visual graphs row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

                  {/* Booking trend line chart */}
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>7-Day Booking Trend</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Daily patient visits this week</div>
                    <LineChart data={weekData} color="#0D9488" height={80} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
                        <span key={d} style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{d}</span>
                      ))}
                    </div>
                  </div>

                  {/* Status donut chart */}
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Booking Status</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Distribution by status</div>
                    {statusSegments.length > 0
                      ? <DonutChart segments={statusSegments} size={120} />
                      : <div style={{ textAlign: 'center', padding: 20, color: '#94A3B8', fontSize: 13 }}>No data for period</div>
                    }
                  </div>
                </div>

                {/* ANALYTICS 1: Traffic from Ads */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 20, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Traffic from Your Ads</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Patients who came after seeing your CareBridge advertisement</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleDownloadAdAnalyticsCSV} style={{ padding: '7px 14px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>CSV</button>
                      <button onClick={handleDownloadAdAnalyticsPDF} style={{ padding: '7px 14px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>PDF</button>
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

                    {/* Ad traffic mini bar chart */}
                    {fromAds.length > 0 && (
                      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Ad Traffic Trend</div>
                        <LineChart data={weekData} color="#7C3AED" height={60} />
                      </div>
                    )}
                    {fromAds.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8', fontSize: 13 }}>No ad traffic data yet. Post an ad to start tracking.</div>
                    )}
                  </div>
                </div>

                {/* ANALYTICS 2: Traffic from Assistance */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 20, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Traffic from Assistance Services</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Patients via OPD assistants and ambulance</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleDownloadAssistAnalyticsCSV} style={{ padding: '7px 14px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>CSV</button>
                      <button onClick={handleDownloadAssistAnalyticsPDF} style={{ padding: '7px 14px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>PDF</button>
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

                    {/* Service donut */}
                    {totalSvc > 0 && svcBreakdown.some(s => s.count > 0) && (
                      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Service Mix</div>
                        <DonutChart segments={svcBreakdown.filter(s => s.count > 0).map(s => ({ label: s.label, value: s.count, color: s.color }))} size={100} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Monthly trend bar chart */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Monthly Patient Trend</div>
                  </div>
                  <div style={{ padding: 20 }}>
                    {monthData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8', fontSize: 13 }}>No data for selected period</div>
                    ) : (
                      <>
                        {/* Bar chart */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140, marginBottom: 16 }}>
                          {monthData.map(([month, count]) => (
                            <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#0D9488' }}>{count}</div>
                              <div style={{ width: '100%', background: 'linear-gradient(to top,#0D9488,#34d399)', borderRadius: '4px 4px 0 0', height: `${(count/maxMonth)*100}px`, minHeight: 4, transition: 'height 0.5s ease' }} />
                              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textAlign: 'center' }}>{month}</div>
                            </div>
                          ))}
                        </div>
                        {/* Line chart overlay */}
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Trend Line</div>
                          <LineChart data={monthData.map(([,v]) => v)} color="#0D9488" height={60} />
                        </div>
                      </>
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
