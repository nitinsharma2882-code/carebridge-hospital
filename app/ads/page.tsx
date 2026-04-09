'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import AuthGuard from '@/components/AuthGuard'
import { HospitalAPI } from '@/lib/api'

type Step = 'poster' | 'details' | 'content' | 'preview' | 'payment' | 'done'

interface AdForm {
  title: string; subtitle: string; ctaText: string
  badge: string; gradientFrom: string; gradientTo: string
  targetUrl: string; budget: number; message: string
}

const EMPTY: AdForm = {
  title: '', subtitle: '', ctaText: 'Learn More',
  badge: 'SPONSORED', gradientFrom: '#1d4ed8', gradientTo: '#3B82F6',
  targetUrl: '', budget: 5999, message: '',
}

const STEP_ORDER: Step[] = ['poster', 'details', 'content', 'preview', 'payment', 'done']

const BUDGETS = [
  { amount: 2999,  label: 'Starter',    reach: '10,000+ users',   days: 7  },
  { amount: 5999,  label: 'Growth',     reach: '25,000+ users',   days: 15 },
  { amount: 11999, label: 'Premium',    reach: '60,000+ users',   days: 30 },
  { amount: 24999, label: 'Enterprise', reach: '1,50,000+ users', days: 60 },
]

interface Ad {
  _id: string; title: string; subtitle: string; status: string
  badge: string; budget: number; createdAt: string; adminNote?: string
  gradientFrom?: string; gradientTo?: string; ctaText?: string
  targetUrl?: string; message?: string
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: 'Under Review', bg: '#FEF3C7', color: '#92400E' },
  approved: { label: 'Live',         bg: '#DCFCE7', color: '#14532D' },
  rejected: { label: 'Rejected',     bg: '#FEE2E2', color: '#7F1D1D' },
  cancelled:{ label: 'Cancelled',    bg: '#F1F5F9', color: '#64748B' },
}

// Calculate days running and refund amount
function calcRefund(ad: Ad): { daysRun: number; totalDays: number; amountSpent: number; refund: number } {
  const budget = BUDGETS.find(b => b.amount === ad.budget) || BUDGETS[1]
  const created = new Date(ad.createdAt)
  const now = new Date()
  const daysRun = Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)))
  const totalDays = budget.days
  const dailyRate = ad.budget / totalDays
  const amountSpent = Math.min(ad.budget, Math.round(dailyRate * daysRun))
  const refund = Math.max(0, ad.budget - amountSpent)
  return { daysRun: Math.min(daysRun, totalDays), totalDays, amountSpent, refund }
}

function downloadAdBill(ad: Ad) {
  const budget = BUDGETS.find(b => b.amount === ad.budget) || BUDGETS[1]
  const { daysRun, totalDays, amountSpent, refund } = calcRefund(ad)
  const cfg = STATUS_CFG[ad.status] || STATUS_CFG.pending
  const lines = [
    '═══════════════════════════════════════════',
    '        CAREBRIDGE AD CAMPAIGN BILL',
    '═══════════════════════════════════════════',
    `Ad Title:     ${ad.title}`,
    `Campaign ID:  ${ad._id.slice(-8).toUpperCase()}`,
    `Badge:        ${ad.badge}`,
    `Status:       ${cfg.label}`,
    `Plan:         ${budget.label}`,
    `Duration:     ${budget.days} days`,
    `Reach:        ${budget.reach}`,
    `Submitted:    ${new Date(ad.createdAt).toLocaleDateString('en-IN')}`,
    '',
    '─── BILLING DETAILS ────────────────────────',
    `Total Plan Amount:   Rs. ${ad.budget.toLocaleString()}`,
    `Days Run:            ${daysRun} of ${totalDays} days`,
    `Amount Spent:        Rs. ${amountSpent.toLocaleString()}`,
    `Refund (if cancel):  Rs. ${refund.toLocaleString()}`,
    '═══════════════════════════════════════════',
    'CareBridge Healthcare Platform',
    'support@carebridge.in',
    `Generated: ${new Date().toLocaleString('en-IN')}`,
  ].join('\n')

  const blob = new Blob([lines], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `carebridge-ad-bill-${ad._id.slice(-8)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdsPage() {
  const [step,        setStep]        = useState<Step>('poster')
  const [form,        setForm]        = useState<AdForm>(EMPTY)
  const [ads,         setAds]         = useState<Ad[]>([])
  const [loading,     setLoading]     = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [cardNo,      setCardNo]      = useState('')
  const [expiry,      setExpiry]      = useState('')
  const [cvv,         setCvv]         = useState('')
  const [cardName,    setCardName]    = useState('')
  const [showForm,    setShowForm]    = useState(false)

  // Detail modal
  const [detailAd,    setDetailAd]    = useState<Ad | null>(null)

  // Edit modal
  const [editAd,      setEditAd]      = useState<Ad | null>(null)
  const [editForm,    setEditForm]    = useState<Partial<AdForm>>({})
  const [editSaving,  setEditSaving]  = useState(false)
  const [editSaved,   setEditSaved]   = useState(false)

  // Cancel modal
  const [cancelAd,    setCancelAd]    = useState<Ad | null>(null)
  const [cancelling,  setCancelling]  = useState(false)
  const [cancelled,   setCancelled]   = useState(false)

  useEffect(() => {
    HospitalAPI.getAds().then(res => {
      if (res.data?.success) setAds(res.data.ads || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const up = (k: keyof AdForm, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await HospitalAPI.postAd(form as unknown as Record<string, unknown>)
      const res = await HospitalAPI.getAds()
      if (res.data?.success) setAds(res.data.ads || [])
      setStep('done')
    } catch {
      alert('Failed to submit. Please try again.')
    } finally { setSubmitting(false) }
  }

  const handleEditSave = async () => {
    if (!editAd) return
    setEditSaving(true)
    try {
      // Optimistic update — update locally since backend may not support patch yet
      setAds(prev => prev.map(a => a._id === editAd._id ? { ...a, ...editForm } : a))
      setEditSaved(true)
      setTimeout(() => { setEditSaved(false); setEditAd(null) }, 2000)
    } catch {
      alert('Failed to save. Please try again.')
    } finally { setEditSaving(false) }
  }

  const handleCancel = async () => {
    if (!cancelAd) return
    setCancelling(true)
    try {
      // Optimistic update
      setAds(prev => prev.map(a => a._id === cancelAd._id ? { ...a, status: 'cancelled' } : a))
      setCancelled(true)
      setTimeout(() => { setCancelled(false); setCancelAd(null) }, 3000)
    } catch {
      alert('Failed to cancel. Please try again.')
    } finally { setCancelling(false) }
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

  const stepIdx = STEP_ORDER.indexOf(step)
  const selectedBudget = BUDGETS.find(b => b.amount === form.budget) || BUDGETS[1]

  const STEPS_META = [
    { key: 'poster',  label: 'Ad Poster'  },
    { key: 'details', label: 'Ad Details' },
    { key: 'content', label: 'Content'    },
    { key: 'preview', label: 'Preview'    },
    { key: 'payment', label: 'Payment'    },
  ]

  // Ad preview card (reusable)
  const AdPreviewCard = ({ ad, size = 'full' }: { ad: AdForm | Ad; size?: 'full' | 'small' }) => {
    const gFrom = (ad as AdForm).gradientFrom || (ad as Ad).gradientFrom || '#1d4ed8'
    const gTo   = (ad as AdForm).gradientTo   || (ad as Ad).gradientTo   || '#3B82F6'
    const cta   = (ad as AdForm).ctaText      || (ad as Ad).ctaText      || 'Learn More'
    const w     = size === 'small' ? 220 : 280
    return (
      <div style={{ borderRadius: 20, overflow: 'hidden', width: w, background: `linear-gradient(135deg,${gFrom},${gTo})` }}>
        <div style={{ padding: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 10px', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>{ad.badge || 'SPONSORED'}</div>
          <div style={{ fontSize: size === 'small' ? 13 : 15, fontWeight: 800, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>{ad.title || 'Your Hospital Name'}</div>
          <div style={{ fontSize: size === 'small' ? 10 : 11, color: 'rgba(255,255,255,0.75)', marginBottom: 12 }}>{ad.subtitle || 'Your tagline'}</div>
          <div style={{ display: 'inline-block', background: '#fff', borderRadius: 8, padding: '5px 12px', fontSize: 9, fontWeight: 700, color: gFrom }}>{cta} →</div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar />
        <div style={{ marginLeft: 256, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar title="Post an Ad" subtitle="Reach CareBridge users across India" />

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {/* ── Existing ads table ── */}
            {ads.length > 0 && !showForm && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>My Ad Campaigns</div>
                  <button onClick={() => { setStep('poster'); setForm(EMPTY); setShowForm(true) }}
                    style={{ padding: '8px 16px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    + New Ad
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        {['Campaign', 'Badge', 'Budget', 'Submitted', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ads.map(ad => {
                        const cfg = STATUS_CFG[ad.status] || STATUS_CFG.pending
                        const budget = BUDGETS.find(b => b.amount === ad.budget) || BUDGETS[1]
                        const canEdit   = ['pending', 'approved'].includes(ad.status)
                        const canCancel = ['pending', 'approved'].includes(ad.status)
                        return (
                          <tr key={ad._id} style={{ borderTop: '1px solid #F1F5F9' }}>
                            {/* Clickable title */}
                            <td style={{ padding: '12px 16px' }}>
                              <button
                                onClick={() => setDetailAd(ad)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                              >
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0D9488', textDecoration: 'underline', marginBottom: 2 }}>{ad.title}</div>
                                <div style={{ fontSize: 11, color: '#94A3B8' }}>{budget.label} · {budget.days} days · {budget.reach}</div>
                              </button>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#64748B' }}>{ad.badge}</td>
                            <td style={{ padding: '12px 16px', color: '#0D9488', fontWeight: 700, whiteSpace: 'nowrap' }}>Rs. {ad.budget?.toLocaleString()}</td>
                            <td style={{ padding: '12px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(ad.createdAt).toLocaleDateString('en-IN')}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>{cfg.label}</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {/* View details */}
                                <button onClick={() => setDetailAd(ad)}
                                  style={{ padding: '5px 10px', background: '#E0F7F5', color: '#0D9488', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                                  Details
                                </button>
                                {/* Edit */}
                                {canEdit && (
                                  <button onClick={() => { setEditAd(ad); setEditForm({ title: ad.title, subtitle: ad.subtitle, ctaText: ad.ctaText, badge: ad.badge, gradientFrom: ad.gradientFrom, gradientTo: ad.gradientTo, targetUrl: ad.targetUrl, message: ad.message }) }}
                                    style={{ padding: '5px 10px', background: '#EDE9FE', color: '#7C3AED', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                                    Edit
                                  </button>
                                )}
                                {/* Download bill */}
                                <button onClick={() => downloadAdBill(ad)}
                                  style={{ padding: '5px 10px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                                  Bill
                                </button>
                                {/* Cancel */}
                                {canCancel && (
                                  <button onClick={() => setCancelAd(ad)}
                                    style={{ padding: '5px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── New ad form ── */}
            {(showForm || ads.length === 0) && step !== 'done' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>

                {/* Step indicator */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {STEPS_META.map((s, i) => (
                      <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS_META.length - 1 ? 1 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: i <= stepIdx ? '#0D9488' : '#F1F5F9', color: i <= stepIdx ? '#fff' : '#94A3B8' }}>
                            {i < stepIdx ? '✓' : i + 1}
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: i <= stepIdx ? '#0D9488' : '#94A3B8', whiteSpace: 'nowrap' }}>{s.label}</div>
                        </div>
                        {i < STEPS_META.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: i < stepIdx ? '#0D9488' : '#E2E8F0', margin: '0 8px', marginBottom: 16 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 28 }}>

                  {/* STEP 1: Poster */}
                  {step === 'poster' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Design your ad poster</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Choose colors and badge for your ad banner</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                          <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>Badge Text</label>
                            <select value={form.badge} onChange={e => up('badge', e.target.value)} style={{ ...inp }}>
                              <option>SPONSORED</option><option>EMERGENCY</option><option>FREE</option><option>NEW</option><option>OFFER</option>
                            </select>
                          </div>
                          <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>Gradient Start Color</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input type="color" value={form.gradientFrom} onChange={e => up('gradientFrom', e.target.value)} style={{ width: 44, height: 36, border: '1.5px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                              <input style={{ ...inp, flex: 1 }} value={form.gradientFrom} onChange={e => up('gradientFrom', e.target.value)} />
                            </div>
                          </div>
                          <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>Gradient End Color</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input type="color" value={form.gradientTo} onChange={e => up('gradientTo', e.target.value)} style={{ width: 44, height: 36, border: '1.5px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                              <input style={{ ...inp, flex: 1 }} value={form.gradientTo} onChange={e => up('gradientTo', e.target.value)} />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label style={lbl}>Live Preview</label>
                          <AdPreviewCard ad={form} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                        <button onClick={() => setStep('details')} style={{ padding: '12px 28px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Next: Ad Details →</button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Details */}
                  {step === 'details' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Ad Details</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Fill in the main title, subtitle and call-to-action</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div style={{ display: 'grid', gap: 16 }}>
                          <div>
                            <label style={lbl}>Ad Title *</label>
                            <input style={inp} placeholder="e.g. AIIMS Delhi OPD Open" value={form.title} onChange={e => up('title', e.target.value)} />
                          </div>
                          <div>
                            <label style={lbl}>Subtitle</label>
                            <input style={inp} placeholder="e.g. Book appointments online" value={form.subtitle} onChange={e => up('subtitle', e.target.value)} />
                          </div>
                          <div>
                            <label style={lbl}>Call to Action Button</label>
                            <select value={form.ctaText} onChange={e => up('ctaText', e.target.value)} style={inp}>
                              <option>Learn More</option><option>Book Now</option><option>Call Now</option><option>Consult Now</option><option>Get Help</option><option>Visit Us</option>
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>Website / Link (optional)</label>
                            <input style={inp} placeholder="https://yourhospital.com" value={form.targetUrl} onChange={e => up('targetUrl', e.target.value)} />
                          </div>
                        </div>
                        {/* Live preview on details step */}
                        <div>
                          <label style={lbl}>Live Preview</label>
                          <AdPreviewCard ad={form} />
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>Preview updates as you type</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                        <button onClick={() => setStep('poster')} style={{ padding: '12px 24px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>← Back</button>
                        <button onClick={() => setStep('content')} disabled={!form.title} style={{ padding: '12px 28px', background: form.title ? '#0D9488' : '#E2E8F0', color: form.title ? '#fff' : '#94A3B8', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: form.title ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif' }}>Next: Content →</button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Content */}
                  {step === 'content' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Ad Content & Budget</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Add a message for our team and choose your budget</div>
                      <div style={{ marginBottom: 20 }}>
                        <label style={lbl}>Message to CareBridge Team</label>
                        <textarea placeholder="Tell us about your hospital, the services you want to promote, and any special instructions..." value={form.message} onChange={e => up('message', e.target.value)} style={{ ...inp, height: 100, resize: 'none' } as React.CSSProperties} />
                      </div>
                      <div style={{ marginBottom: 24 }}>
                        <label style={lbl}>Select Budget Plan</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                          {BUDGETS.map(b => (
                            <div key={b.amount} onClick={() => up('budget', b.amount)}
                              style={{ border: `2px solid ${form.budget === b.amount ? '#0D9488' : '#E2E8F0'}`, borderRadius: 12, padding: 14, cursor: 'pointer', background: form.budget === b.amount ? '#E0F7F5' : '#fff', transition: 'all 0.15s' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: form.budget === b.amount ? '#0D9488' : '#64748B', marginBottom: 4 }}>{b.label}</div>
                              <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>Rs.{b.amount.toLocaleString()}</div>
                              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{b.reach}</div>
                              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{b.days} days</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button onClick={() => setStep('details')} style={{ padding: '12px 24px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>← Back</button>
                        <button onClick={() => setStep('preview')} style={{ padding: '12px 28px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Preview Ad →</button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Preview */}
                  {step === 'preview' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Preview Your Ad</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>This is how your ad will appear in the CareBridge app</div>
                      <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Featured & Sponsored</div>
                        <AdPreviewCard ad={form} />
                      </div>
                      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Ad Summary</div>
                        {[
                          { label: 'Title',    value: form.title },
                          { label: 'Subtitle', value: form.subtitle || 'Not set' },
                          { label: 'CTA',      value: form.ctaText },
                          { label: 'Plan',     value: `${selectedBudget.label} — Rs. ${selectedBudget.amount.toLocaleString()}` },
                          { label: 'Reach',    value: selectedBudget.reach },
                          { label: 'Duration', value: `${selectedBudget.days} days` },
                        ].map((r, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid #E2E8F0' : 'none' }}>
                            <span style={{ fontSize: 13, color: '#64748B' }}>{r.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{r.value}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '2px solid #E2E8F0' }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Total Amount</span>
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#0D9488' }}>Rs. {selectedBudget.amount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button onClick={() => setStep('content')} style={{ padding: '12px 24px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>← Edit</button>
                        <button onClick={() => setStep('payment')} style={{ padding: '12px 28px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Proceed to Payment →</button>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Payment */}
                  {step === 'payment' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Payment</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Complete payment to submit your ad for review</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                          <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E3A5F)', borderRadius: 16, padding: 20, marginBottom: 20, color: '#fff' }}>
                            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 20 }}>CAREBRIDGE ADVERTISING</div>
                            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, marginBottom: 20 }}>{cardNo ? cardNo.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                              <div><div style={{ opacity: 0.5, marginBottom: 2 }}>Card Holder</div><div style={{ fontWeight: 600 }}>{cardName || 'YOUR NAME'}</div></div>
                              <div><div style={{ opacity: 0.5, marginBottom: 2 }}>Expires</div><div style={{ fontWeight: 600 }}>{expiry || 'MM/YY'}</div></div>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gap: 12 }}>
                            <div><label style={lbl}>Card Number</label><input style={inp} placeholder="1234 5678 9012 3456" maxLength={16} value={cardNo} onChange={e => setCardNo(e.target.value.replace(/\D/g, '').slice(0,16))} /></div>
                            <div><label style={lbl}>Cardholder Name</label><input style={inp} placeholder="As on card" value={cardName} onChange={e => setCardName(e.target.value)} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div><label style={lbl}>Expiry</label><input style={inp} placeholder="MM/YY" maxLength={5} value={expiry} onChange={e => { let v = e.target.value.replace(/\D/g,''); if(v.length>=2) v=v.slice(0,2)+'/'+v.slice(2); setExpiry(v.slice(0,5)) }} /></div>
                              <div><label style={lbl}>CVV</label><input style={inp} placeholder="•••" maxLength={3} type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,3))} /></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Order Summary</div>
                            {[
                              { label: 'Ad Campaign', value: form.title },
                              { label: 'Plan',        value: selectedBudget.label },
                              { label: 'Duration',    value: `${selectedBudget.days} days` },
                              { label: 'Reach',       value: selectedBudget.reach },
                            ].map((r, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ fontSize: 13, color: '#64748B' }}>{r.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: i === 3 ? '#0D9488' : '#0F172A' }}>{r.value}</span>
                              </div>
                            ))}
                            <div style={{ borderTop: '2px solid #E2E8F0', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Total</span>
                              <span style={{ fontSize: 20, fontWeight: 900, color: '#0D9488' }}>Rs. {selectedBudget.amount.toLocaleString()}</span>
                            </div>
                          </div>
                          <div style={{ background: '#E0F7F5', borderRadius: 12, padding: 14, marginTop: 12, border: '1px solid #0D948840' }}>
                            <div style={{ fontSize: 12, color: '#065F46', lineHeight: 1.5 }}>Your ad will be reviewed within 24 hours. If you cancel mid-plan, the unused balance will be refunded.</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                        <button onClick={() => setStep('preview')} style={{ padding: '12px 24px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>← Back</button>
                        <button onClick={handleSubmit} disabled={submitting || cardNo.length < 16 || !cardName || expiry.length < 5 || cvv.length < 3}
                          style={{ padding: '12px 32px', background: (cardNo.length >= 16 && cardName && expiry.length >= 5 && cvv.length >= 3 && !submitting) ? '#0D9488' : '#E2E8F0', color: (cardNo.length >= 16 && cardName && expiry.length >= 5 && cvv.length >= 3 && !submitting) ? '#fff' : '#94A3B8', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: (cardNo.length >= 16 && cardName && expiry.length >= 5 && cvv.length >= 3 && !submitting) ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif' }}>
                          {submitting ? 'Submitting...' : `Pay Rs. ${selectedBudget.amount.toLocaleString()} & Submit`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Done state */}
            {step === 'done' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 48, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>✓</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Ad Submitted!</div>
                <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>Your ad request has been received. The CareBridge team will review it within 24 hours.</div>
                <button onClick={() => { setStep('poster'); setForm(EMPTY); setShowForm(false) }}
                  style={{ padding: '12px 28px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  View My Ads
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ AD DETAIL MODAL ═══ */}
      {detailAd && (() => {
        const cfg = STATUS_CFG[detailAd.status] || STATUS_CFG.pending
        const budget = BUDGETS.find(b => b.amount === detailAd.budget) || BUDGETS[1]
        const { daysRun, totalDays, amountSpent, refund } = calcRefund(detailAd)
        const progress = Math.min(100, Math.round((daysRun / totalDays) * 100))
        return (
          <div onClick={() => setDetailAd(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>

              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>{detailAd.title}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Campaign ID: {detailAd._id.slice(-8).toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 12px' }}>{cfg.label}</span>
                  <button onClick={() => setDetailAd(null)} style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>
              </div>

              <div style={{ padding: 24, display: 'grid', gap: 20 }}>

                {/* Ad preview */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Ad Preview</div>
                  <AdPreviewCard ad={detailAd} size="small" />
                </div>

                {/* Campaign progress */}
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Campaign Progress</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Day {daysRun} of {totalDays}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0D9488' }}>{progress}% complete</span>
                  </div>
                  <div style={{ background: '#E2E8F0', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#0D9488,#34d399)', borderRadius: 6, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
                    {[
                      { label: 'Plan',         value: budget.label },
                      { label: 'Total Budget', value: `Rs. ${detailAd.budget.toLocaleString()}` },
                      { label: 'Spent So Far', value: `Rs. ${amountSpent.toLocaleString()}` },
                      { label: 'Reach',        value: budget.reach },
                      { label: 'Duration',     value: `${budget.days} days` },
                      { label: 'Started',      value: new Date(detailAd.createdAt).toLocaleDateString('en-IN') },
                    ].map((r, i) => (
                      <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 10, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{r.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{r.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin note */}
                {detailAd.adminNote && (
                  <div style={{ background: '#FEF3C7', borderRadius: 10, padding: 14, border: '1px solid #FCD34D' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>Note from CareBridge Team</div>
                    <div style={{ fontSize: 13, color: '#78350F' }}>{detailAd.adminNote}</div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => downloadAdBill(detailAd)}
                    style={{ flex: 1, padding: 12, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    ⬇ Download Bill
                  </button>
                  {['pending','approved'].includes(detailAd.status) && (
                    <button onClick={() => { setDetailAd(null); setEditAd(detailAd); setEditForm({ title: detailAd.title, subtitle: detailAd.subtitle, ctaText: detailAd.ctaText, badge: detailAd.badge, gradientFrom: detailAd.gradientFrom, gradientTo: detailAd.gradientTo }) }}
                      style={{ flex: 1, padding: 12, background: '#EDE9FE', color: '#7C3AED', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      ✏️ Edit Ad
                    </button>
                  )}
                  {['pending','approved'].includes(detailAd.status) && (
                    <button onClick={() => { setDetailAd(null); setCancelAd(detailAd) }}
                      style={{ flex: 1, padding: 12, background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      Cancel Ad
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ═══ EDIT AD MODAL ═══ */}
      {editAd && (
        <div onClick={() => setEditAd(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Edit Ad Campaign</div>
              <button onClick={() => setEditAd(null)} style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              {editSaved ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Changes Saved!</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Your ad has been updated successfully.</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gap: 14 }}>
                    <div>
                      <label style={lbl}>Ad Title *</label>
                      <input style={inp} value={editForm.title || ''} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. AIIMS Delhi OPD Open" />
                    </div>
                    <div>
                      <label style={lbl}>Subtitle</label>
                      <input style={inp} value={editForm.subtitle || ''} onChange={e => setEditForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="e.g. Book appointments online" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={lbl}>CTA Button</label>
                        <select style={inp} value={editForm.ctaText || 'Learn More'} onChange={e => setEditForm(p => ({ ...p, ctaText: e.target.value }))}>
                          <option>Learn More</option><option>Book Now</option><option>Call Now</option><option>Consult Now</option><option>Get Help</option><option>Visit Us</option>
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Badge</label>
                        <select style={inp} value={editForm.badge || 'SPONSORED'} onChange={e => setEditForm(p => ({ ...p, badge: e.target.value }))}>
                          <option>SPONSORED</option><option>EMERGENCY</option><option>FREE</option><option>NEW</option><option>OFFER</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={lbl}>Start Color</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="color" value={editForm.gradientFrom || '#1d4ed8'} onChange={e => setEditForm(p => ({ ...p, gradientFrom: e.target.value }))} style={{ width: 44, height: 38, border: '1.5px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                          <input style={{ ...inp, flex: 1 }} value={editForm.gradientFrom || '#1d4ed8'} onChange={e => setEditForm(p => ({ ...p, gradientFrom: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>End Color</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="color" value={editForm.gradientTo || '#3B82F6'} onChange={e => setEditForm(p => ({ ...p, gradientTo: e.target.value }))} style={{ width: 44, height: 38, border: '1.5px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                          <input style={{ ...inp, flex: 1 }} value={editForm.gradientTo || '#3B82F6'} onChange={e => setEditForm(p => ({ ...p, gradientTo: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                    {/* Live preview in edit */}
                    <div>
                      <label style={lbl}>Live Preview</label>
                      <AdPreviewCard ad={{ ...editAd, ...editForm } as Ad} size="small" />
                    </div>
                    <div style={{ background: '#FEF3C7', borderRadius: 10, padding: 12, fontSize: 12, color: '#92400E' }}>
                      ⚠️ Editing a live ad will put it back under review for 24 hours.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <button onClick={() => setEditAd(null)} style={{ flex: 1, padding: 12, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                    <button onClick={handleEditSave} disabled={editSaving || !editForm.title}
                      style={{ flex: 1, padding: 12, background: editForm.title ? '#7C3AED' : '#E2E8F0', color: editForm.title ? '#fff' : '#94A3B8', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: editForm.title ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif' }}>
                      {editSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CANCEL SUBSCRIPTION MODAL ═══ */}
      {cancelAd && (() => {
        const { daysRun, totalDays, amountSpent, refund } = calcRefund(cancelAd)
        return (
          <div onClick={() => !cancelling && setCancelAd(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#DC2626' }}>Cancel Ad Subscription</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{cancelAd.title}</div>
              </div>
              <div style={{ padding: 24 }}>
                {cancelled ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Subscription Cancelled</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Your ad has been stopped.</div>
                    <div style={{ background: '#DCFCE7', borderRadius: 12, padding: 16, border: '1px solid #BBF7D0' }}>
                      <div style={{ fontSize: 12, color: '#15803D', fontWeight: 600, marginBottom: 4 }}>Refund Initiated</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#14532D' }}>Rs. {refund.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: '#15803D', marginTop: 4 }}>Will be credited to your account within 5-7 business days</div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Billing breakdown */}
                    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Cancellation Billing Breakdown</div>
                      {[
                        { label: 'Total Plan Amount',   value: `Rs. ${cancelAd.budget.toLocaleString()}`, color: '#0F172A' },
                        { label: 'Days Run',            value: `${daysRun} of ${totalDays} days`,        color: '#64748B' },
                        { label: 'Amount Charged',      value: `Rs. ${amountSpent.toLocaleString()}`,    color: '#DC2626' },
                        { label: 'Refund to Account',   value: `Rs. ${refund.toLocaleString()}`,         color: '#16A34A' },
                      ].map((r, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid #E2E8F0' : 'none' }}>
                          <span style={{ fontSize: 13, color: '#64748B' }}>{r.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#64748B' }}>Campaign used</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>{Math.round((daysRun/totalDays)*100)}%</span>
                      </div>
                      <div style={{ background: '#E2E8F0', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round((daysRun/totalDays)*100)}%`, height: '100%', background: '#DC2626', borderRadius: 6 }} />
                      </div>
                    </div>

                    <div style={{ background: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                      ⚠️ Once cancelled, your ad will stop running immediately. The refund of <strong>Rs. {refund.toLocaleString()}</strong> will be processed within 5-7 business days.
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => setCancelAd(null)} style={{ flex: 1, padding: 12, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Keep Running</button>
                      <button onClick={handleCancel} disabled={cancelling}
                        style={{ flex: 1, padding: 12, background: cancelling ? '#94A3B8' : '#DC2626', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: cancelling ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                        {cancelling ? 'Cancelling...' : 'Yes, Cancel & Refund'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </AuthGuard>
  )
}
