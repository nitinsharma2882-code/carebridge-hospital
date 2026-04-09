'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import AuthGuard from '@/components/AuthGuard'
import { HospitalAPI } from '@/lib/api'

interface Booking {
  _id: string; serviceType: string; hospital?: string
  pickupLocation?: string; destinationHospital?: string
  patientName?: string; patientPhone?: string
  date?: string; time?: string; fare: number
  status: string; createdAt: string; completedAt?: string
  userId?: { name?: string; phone?: string }
  partnerId?: { name?: string; phone?: string }
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:     { label: 'Pending',     bg: '#FEF3C7', color: '#92400E' },
  accepted:    { label: 'Accepted',    bg: '#DBEAFE', color: '#1E40AF' },
  in_progress: { label: 'In Progress', bg: '#E0F7F5', color: '#065F46' },
  completed:   { label: 'Completed',   bg: '#DCFCE7', color: '#14532D' },
  cancelled:   { label: 'Cancelled',   bg: '#FEE2E2', color: '#7F1D1D' },
  escalated:   { label: 'Escalated',   bg: '#EDE9FE', color: '#4C1D95' },
  upcoming:    { label: 'Upcoming',    bg: '#DBEAFE', color: '#1E40AF' },
  scheduled:   { label: 'Scheduled',   bg: '#DBEAFE', color: '#1E40AF' },
}

const SERVICE_LABELS: Record<string, string> = {
  opd_assistant: 'OPD Assistant', ambulance: 'Ambulance',
  nursing: 'Nursing Care', general: 'General Help',
}

function downloadCSV(bookings: Booking[]) {
  const headers = ['Booking ID', 'Service', 'Patient', 'Phone', 'Hospital', 'Date', 'Fare', 'Status', 'Partner', 'Created']
  const rows = bookings.map(b => [
    b._id.slice(-8).toUpperCase(),
    SERVICE_LABELS[b.serviceType] || b.serviceType,
    b.userId?.name || b.patientName || 'N/A',
    b.userId?.phone || b.patientPhone || 'N/A',
    b.hospital || b.destinationHospital || 'N/A',
    b.date || new Date(b.createdAt).toLocaleDateString('en-IN'),
    `Rs. ${b.fare}`,
    STATUS_CFG[b.status]?.label || b.status,
    b.partnerId?.name || 'Unassigned',
    new Date(b.createdAt).toLocaleDateString('en-IN'),
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url
  a.download = `carebridge-bookings-${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function downloadPDF(bookings: Booking[]) {
  const lines: string[] = [
    'CAREBRIDGE HOSPITAL BOOKINGS REPORT',
    `Generated: ${new Date().toLocaleDateString('en-IN')}`,
    `Total Bookings: ${bookings.length}`,
    '',
    ...bookings.map((b, i) =>
      `${i + 1}. [${b._id.slice(-8).toUpperCase()}] ${SERVICE_LABELS[b.serviceType] || b.serviceType} | ${STATUS_CFG[b.status]?.label || b.status} | Rs.${b.fare} | ${b.date || new Date(b.createdAt).toLocaleDateString('en-IN')}`
    )
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url
  a.download = `carebridge-bookings-${Date.now()}.txt`; a.click()
  URL.revokeObjectURL(url)
}

// Helper: is a booking "upcoming" (has a future date)
function isUpcoming(b: Booking): boolean {
  if (!b.date) return false
  const bookingDate = new Date(b.date)
  return bookingDate > new Date() && !['completed', 'cancelled'].includes(b.status)
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<'all' | 'upcoming' | 'completed' | 'pending' | 'cancelled'>('all')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    HospitalAPI.getBookings().then(res => {
      // Support both {success, bookings} and {bookings} formats
      const data = res.data
      setBookings(data?.bookings || data?.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const upcomingBookings = bookings.filter(isUpcoming)

  const filtered = bookings
    .filter(b => {
      if (tab === 'all')       return true
      if (tab === 'upcoming')  return isUpcoming(b)
      if (tab === 'completed') return b.status === 'completed'
      if (tab === 'cancelled') return b.status === 'cancelled'
      if (tab === 'pending')   return ['pending', 'accepted', 'in_progress'].includes(b.status)
      return true
    })
    .filter(b => {
      if (!search) return true
      const q = search.toLowerCase()
      return (b.userId?.name || b.patientName || '').toLowerCase().includes(q)
        || b._id.toLowerCase().includes(q)
        || (b.hospital || b.destinationHospital || '').toLowerCase().includes(q)
    })

  const tabs = [
    { key: 'all',       label: 'All',       count: bookings.length },
    { key: 'upcoming',  label: '📅 Upcoming', count: upcomingBookings.length },
    { key: 'pending',   label: 'Active',    count: bookings.filter(b => ['pending','accepted','in_progress'].includes(b.status)).length },
    { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
  ] as const

  const shareBooking = (b: Booking) => {
    const text = `CareBridge Booking #${b._id.slice(-8).toUpperCase()}\nService: ${SERVICE_LABELS[b.serviceType]}\nStatus: ${STATUS_CFG[b.status]?.label}\nFare: Rs.${b.fare}`
    if (navigator.share) {
      navigator.share({ title: 'CareBridge Booking', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Booking details copied to clipboard')
    }
  }

  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar />
        <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar
            title="Bookings"
            subtitle={`${bookings.length} total bookings via CareBridge`}
            actions={
              <>
                <button onClick={() => downloadCSV(filtered)}
                  style={{ padding: '8px 14px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  Download CSV
                </button>
                <button onClick={() => downloadPDF(filtered)}
                  style={{ padding: '8px 14px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  Download PDF
                </button>
              </>
            }
          />

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {/* Upcoming bookings banner — shown only when there are upcoming ones */}
            {upcomingBookings.length > 0 && tab !== 'upcoming' && (
              <div
                onClick={() => setTab('upcoming')}
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', borderRadius: 14, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24 }}>📅</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                      {upcomingBookings.length} Upcoming Booking{upcomingBookings.length > 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                      Next: {upcomingBookings[0]?.date ? new Date(upcomingBookings[0].date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Scheduled'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 20 }}>
                  View All →
                </div>
              </div>
            )}

            {/* Search + tabs */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  placeholder="Search by patient name, booking ID or hospital..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, padding: '8px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
                />
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' }}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{ flex: 1, minWidth: 80, padding: '12px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? '#0D9488' : '#94A3B8', borderBottom: tab === t.key ? '2.5px solid #0D9488' : '2.5px solid transparent', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                    {t.label} <span style={{ marginLeft: 4, background: tab === t.key ? '#E0F7F5' : '#F1F5F9', color: tab === t.key ? '#0D9488' : '#94A3B8', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>{t.count}</span>
                  </button>
                ))}
              </div>

              {/* Upcoming tab: show date-sorted cards */}
              {tab === 'upcoming' && (
                <div style={{ padding: 20 }}>
                  {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>
                      No upcoming bookings scheduled
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {filtered
                        .sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime())
                        .map(b => {
                          const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending
                          const bookingDate = b.date ? new Date(b.date) : new Date(b.createdAt)
                          const daysUntil = Math.ceil((bookingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                          return (
                            <div key={b._id} style={{ border: '1.5px solid #DBEAFE', borderRadius: 12, padding: 16, background: '#F8FAFF', display: 'flex', alignItems: 'center', gap: 16 }}>
                              {/* Date badge */}
                              <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 12, background: '#1d4ed8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <div style={{ fontSize: 18, fontWeight: 900 }}>{bookingDate.getDate()}</div>
                                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase' }}>{bookingDate.toLocaleString('en-IN', { month: 'short' })}</div>
                              </div>
                              {/* Details */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{SERVICE_LABELS[b.serviceType] || b.serviceType}</div>
                                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                                  {b.userId?.name || b.patientName || 'Patient'} • {b.hospital || b.destinationHospital || 'N/A'}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'flex', gap: 12 }}>
                                  <span>{b.time ? `⏰ ${b.time}` : ''}</span>
                                  <span style={{ color: daysUntil === 0 ? '#DC2626' : daysUntil === 1 ? '#D97706' : '#16A34A', fontWeight: 600 }}>
                                    {daysUntil === 0 ? '🔴 Today' : daysUntil === 1 ? '🟡 Tomorrow' : `🟢 In ${daysUntil} days`}
                                  </span>
                                </div>
                              </div>
                              {/* Right side */}
                              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#0D9488' }}>Rs. {b.fare}</div>
                                <span style={{ background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px', display: 'inline-block', marginTop: 4 }}>{cfg.label}</span>
                                <div style={{ marginTop: 8 }}>
                                  <button onClick={() => setSelected(b)}
                                    style={{ padding: '5px 12px', background: '#E0F7F5', color: '#0D9488', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                                    View
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Regular table for other tabs */}
              {tab !== 'upcoming' && (
                loading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>Loading bookings...</div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>No bookings found</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          {['Booking ID', 'Patient', 'Service', 'Hospital', 'Date', 'Fare', 'Status', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(b => {
                          const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending
                          return (
                            <tr key={b._id} style={{ borderTop: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#0F172A', fontWeight: 700, whiteSpace: 'nowrap' }}>#{b._id.slice(-8).toUpperCase()}</td>
                              <td style={{ padding: '12px 16px', color: '#0F172A', fontWeight: 600, whiteSpace: 'nowrap' }}>{b.userId?.name || b.patientName || 'N/A'}</td>
                              <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>{SERVICE_LABELS[b.serviceType] || b.serviceType}</td>
                              <td style={{ padding: '12px 16px', color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.hospital || b.destinationHospital || 'N/A'}</td>
                              <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>{b.date || new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                              <td style={{ padding: '12px 16px', color: '#0D9488', fontWeight: 700, whiteSpace: 'nowrap' }}>Rs. {b.fare}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>{cfg.label}</span>
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => setSelected(b)}
                                    style={{ padding: '5px 10px', background: '#E0F7F5', color: '#0D9488', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                                    View
                                  </button>
                                  <button onClick={() => downloadPDF([b])}
                                    style={{ padding: '5px 10px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                                    Download
                                  </button>
                                  <button onClick={() => shareBooking(b)}
                                    style={{ padding: '5px 10px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                                    Share
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Booking detail popup */}
        {selected && (
          <div onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{SERVICE_LABELS[selected.serviceType] || selected.serviceType}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontFamily: 'monospace' }}>#{selected._id.slice(-8).toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: STATUS_CFG[selected.status]?.bg, color: STATUS_CFG[selected.status]?.color, fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 12px' }}>
                    {STATUS_CFG[selected.status]?.label}
                  </span>
                  <button onClick={() => setSelected(null)}
                    style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                {[
                  { label: 'Patient',       value: selected.userId?.name || selected.patientName || 'N/A' },
                  { label: 'Patient Phone', value: selected.userId?.phone || selected.patientPhone || 'N/A' },
                  { label: 'Hospital',      value: selected.hospital || selected.destinationHospital || 'N/A' },
                  ...(selected.pickupLocation ? [{ label: 'Pickup', value: selected.pickupLocation }] : []),
                  { label: 'Date & Time',   value: selected.date ? `${selected.date}${selected.time ? ' at ' + selected.time : ''}` : new Date(selected.createdAt).toLocaleDateString('en-IN') },
                  { label: 'Fare',          value: `Rs. ${selected.fare}` },
                  { label: 'Partner',       value: selected.partnerId?.name || 'Unassigned' },
                  { label: 'Partner Phone', value: selected.partnerId?.phone || 'N/A' },
                  { label: 'Booked on',     value: new Date(selected.createdAt).toLocaleDateString('en-IN') },
                  ...(selected.completedAt ? [{ label: 'Completed on', value: new Date(selected.completedAt).toLocaleDateString('en-IN') }] : []),
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button onClick={() => downloadPDF([selected])}
                    style={{ flex: 1, padding: 12, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Download
                  </button>
                  <button onClick={() => downloadCSV([selected])}
                    style={{ flex: 1, padding: 12, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Export CSV
                  </button>
                  <button onClick={() => shareBooking(selected)}
                    style={{ flex: 1, padding: 12, background: '#0D9488', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
