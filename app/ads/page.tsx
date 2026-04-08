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
  targetUrl: '', budget: 5000, message: '',
}

const STEP_ORDER: Step[] = ['poster', 'details', 'content', 'preview', 'payment', 'done']

const BUDGETS = [
  { amount: 2999,  label: 'Starter',     reach: '10,000+ users', days: 7 },
  { amount: 5999,  label: 'Growth',      reach: '25,000+ users', days: 15 },
  { amount: 11999, label: 'Premium',     reach: '60,000+ users', days: 30 },
  { amount: 24999, label: 'Enterprise',  reach: '1,50,000+ users', days: 60 },
]

interface Ad {
  _id: string; title: string; subtitle: string; status: string
  badge: string; budget: number; createdAt: string; adminNote?: string
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: 'Under Review', bg: '#FEF3C7', color: '#92400E' },
  approved: { label: 'Live',         bg: '#DCFCE7', color: '#14532D' },
  rejected: { label: 'Rejected',     bg: '#FEE2E2', color: '#7F1D1D' },
}

export default function AdsPage() {
  const [step,       setStep]       = useState<Step>('poster')
  const [form,       setForm]       = useState<AdForm>(EMPTY)
  const [ads,        setAds]        = useState<Ad[]>([])
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cardNo,     setCardNo]     = useState('')
  const [expiry,     setExpiry]     = useState('')
  const [cvv,        setCvv]        = useState('')
  const [cardName,   setCardName]   = useState('')
  const [showForm,   setShowForm]   = useState(false)

  useEffect(() => {
    HospitalAPI.getAds().then(res => {
      if (res.data?.success) setAds(res.data.ads || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const up = (k: keyof AdForm, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await HospitalAPI.postAd(form)
      const res = await HospitalAPI.getAds()
      if (res.data?.success) setAds(res.data.ads || [])
      setStep('done')
    } catch {
      alert('Failed to submit. Please try again.')
    } finally { setSubmitting(false) }
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
    { key: 'poster',  label: 'Ad Poster' },
    { key: 'details', label: 'Ad Details' },
    { key: 'content', label: 'Content' },
    { key: 'preview', label: 'Preview' },
    { key: 'payment', label: 'Payment' },
  ]

  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar />
        <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar title="Post an Ad" subtitle="Reach CareBridge users across India" />

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {/* Existing ads */}
            {ads.length > 0 && !showForm && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>My Ad Requests</div>
                  <button onClick={() => { setStep('poster'); setForm(EMPTY); setShowForm(true) }}
                    style={{ padding: '8px 16px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    + New Ad
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Title', 'Badge', 'Budget', 'Submitted', 'Status', 'Note'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map(ad => {
                      const cfg = STATUS_CFG[ad.status] || STATUS_CFG.pending
                      return (
                        <tr key={ad._id} style={{ borderTop: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{ad.title}</td>
                          <td style={{ padding: '12px 16px', color: '#64748B' }}>{ad.badge}</td>
                          <td style={{ padding: '12px 16px', color: '#0D9488', fontWeight: 700 }}>Rs. {ad.budget?.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', color: '#64748B' }}>{new Date(ad.createdAt).toLocaleDateString('en-IN')}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px' }}>{cfg.label}</span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: 12 }}>{ad.adminNote || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* New ad form */}
            {(showForm || ads.length === 0) && step !== 'done' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>

                {/* Step indicator */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {STEPS_META.map((s, i) => (
                      <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS_META.length - 1 ? 1 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700,
                            background: i < stepIdx ? '#0D9488' : i === stepIdx ? '#0D9488' : '#F1F5F9',
                            color: i <= stepIdx ? '#fff' : '#94A3B8',
                          }}>
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

                  {/* STEP 1: Poster (visual design) */}
                  {step === 'poster' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Design your ad poster</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Choose colors and badge for your ad banner</div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                          <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>Badge Text</label>
                            <select value={form.badge} onChange={e => up('badge', e.target.value)} style={{ ...inp }}>
                              <option>SPONSORED</option>
                              <option>EMERGENCY</option>
                              <option>FREE</option>
                              <option>NEW</option>
                              <option>OFFER</option>
                            </select>
                          </div>
                          <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>Gradient Start Color</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input type="color" value={form.gradientFrom} onChange={e => up('gradientFrom', e.target.value)}
                                style={{ width: 44, height: 36, border: '1.5px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                              <input style={{ ...inp, flex: 1 }} value={form.gradientFrom} onChange={e => up('gradientFrom', e.target.value)} />
                            </div>
                          </div>
                          <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>Gradient End Color</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input type="color" value={form.gradientTo} onChange={e => up('gradientTo', e.target.value)}
                                style={{ width: 44, height: 36, border: '1.5px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                              <input style={{ ...inp, flex: 1 }} value={form.gradientTo} onChange={e => up('gradientTo', e.target.value)} />
                            </div>
                          </div>
                        </div>

                        {/* Live preview */}
                        <div>
                          <label style={lbl}>Live Preview</label>
                          <div style={{ borderRadius: 16, padding: 20, background: `linear-gradient(135deg,${form.gradientFrom},${form.gradientTo})`, minHeight: 140, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{form.badge}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{form.title || 'Your Hospital Name'}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 12 }}>{form.subtitle || 'Your tagline here'}</div>
                            <div style={{ display: 'inline-block', background: '#fff', borderRadius: 8, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: form.gradientFrom }}>{form.ctaText}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                        <button onClick={() => setStep('details')}
                          style={{ padding: '12px 28px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                          Next: Ad Details →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Details */}
                  {step === 'details' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Ad Details</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Fill in the main title, subtitle and call-to-action</div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                            <option>Learn More</option>
                            <option>Book Now</option>
                            <option>Call Now</option>
                            <option>Consult Now</option>
                            <option>Get Help</option>
                            <option>Visit Us</option>
                          </select>
                        </div>
                        <div>
                          <label style={lbl}>Website / Link (optional)</label>
                          <input style={inp} placeholder="https://yourhospital.com" value={form.targetUrl} onChange={e => up('targetUrl', e.target.value)} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                        <button onClick={() => setStep('poster')}
                          style={{ padding: '12px 24px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                          ← Back
                        </button>
                        <button onClick={() => setStep('content')} disabled={!form.title}
                          style={{ padding: '12px 28px', background: form.title ? '#0D9488' : '#E2E8F0', color: form.title ? '#fff' : '#94A3B8', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: form.title ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif' }}>
                          Next: Content →
                        </button>
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
                        <textarea
                          placeholder="Tell us about your hospital, the services you want to promote, and any special instructions..."
                          value={form.message} onChange={e => up('message', e.target.value)}
                          style={{ ...inp, height: 100, resize: 'none' } as React.CSSProperties}
                        />
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
                        <button onClick={() => setStep('details')}
                          style={{ padding: '12px 24px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                          ← Back
                        </button>
                        <button onClick={() => setStep('preview')}
                          style={{ padding: '12px 28px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                          Preview Ad →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Preview */}
                  {step === 'preview' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Preview Your Ad</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>This is how your ad will appear in the CareBridge app</div>

                      {/* App mockup */}
                      <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Featured & Sponsored</div>
                        <div style={{ borderRadius: 20, overflow: 'hidden', width: 280, background: `linear-gradient(135deg,${form.gradientFrom},${form.gradientTo})` }}>
                          <div style={{ padding: 16, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 10px', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>{form.badge}</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>{form.title || 'Your Hospital Name'}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 12 }}>{form.subtitle || 'Your tagline'}</div>
                            <div style={{ display: 'inline-block', background: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 10, fontWeight: 700, color: form.gradientFrom }}>{form.ctaText} →</div>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Ad Summary</div>
                        {[
                          { label: 'Title', value: form.title },
                          { label: 'Subtitle', value: form.subtitle || 'Not set' },
                          { label: 'CTA', value: form.ctaText },
                          { label: 'Plan', value: `${selectedBudget.label} — Rs. ${selectedBudget.amount.toLocaleString()}` },
                          { label: 'Reach', value: selectedBudget.reach },
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
                        <button onClick={() => setStep('content')}
                          style={{ padding: '12px 24px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                          ← Edit
                        </button>
                        <button onClick={() => setStep('payment')}
                          style={{ padding: '12px 28px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                          Proceed to Payment →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Payment */}
                  {step === 'payment' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Payment</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Complete payment to submit your ad for review</div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        {/* Card form */}
                        <div>
                          <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E3A5F)', borderRadius: 16, padding: 20, marginBottom: 20, color: '#fff' }}>
                            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 20 }}>CAREBRIDGE ADVERTISING</div>
                            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, marginBottom: 20 }}>
                              {cardNo ? cardNo.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                              <div><div style={{ opacity: 0.5, marginBottom: 2 }}>Card Holder</div><div style={{ fontWeight: 600 }}>{cardName || 'YOUR NAME'}</div></div>
                              <div><div style={{ opacity: 0.5, marginBottom: 2 }}>Expires</div><div style={{ fontWeight: 600 }}>{expiry || 'MM/YY'}</div></div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gap: 12 }}>
                            <div>
                              <label style={lbl}>Card Number</label>
                              <input style={inp} placeholder="1234 5678 9012 3456" maxLength={16}
                                value={cardNo} onChange={e => setCardNo(e.target.value.replace(/\D/g, '').slice(0,16))} />
                            </div>
                            <div>
                              <label style={lbl}>Cardholder Name</label>
                              <input style={inp} placeholder="As on card" value={cardName} onChange={e => setCardName(e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <label style={lbl}>Expiry</label>
                                <input style={inp} placeholder="MM/YY" maxLength={5} value={expiry}
                                  onChange={e => { let v = e.target.value.replace(/\D/g,''); if(v.length>=2) v=v.slice(0,2)+'/'+v.slice(2); setExpiry(v.slice(0,5)) }} />
                              </div>
                              <div>
                                <label style={lbl}>CVV</label>
                                <input style={inp} placeholder="•••" maxLength={3} type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,3))} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order summary */}
                        <div>
                          <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Order Summary</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                              <span style={{ fontSize: 13, color: '#64748B' }}>Ad Campaign</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{form.title}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                              <span style={{ fontSize: 13, color: '#64748B' }}>Plan</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{selectedBudget.label}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                              <span style={{ fontSize: 13, color: '#64748B' }}>Duration</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{selectedBudget.days} days</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                              <span style={{ fontSize: 13, color: '#64748B' }}>Reach</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#0D9488' }}>{selectedBudget.reach}</span>
                            </div>
                            <div style={{ borderTop: '2px solid #E2E8F0', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Total</span>
                              <span style={{ fontSize: 20, fontWeight: 900, color: '#0D9488' }}>Rs. {selectedBudget.amount.toLocaleString()}</span>
                            </div>
                          </div>

                          <div style={{ background: '#E0F7F5', borderRadius: 12, padding: 14, marginTop: 12, border: '1px solid #0D948840' }}>
                            <div style={{ fontSize: 12, color: '#065F46', lineHeight: 1.5 }}>
                              Your ad will be reviewed by the CareBridge team within 24 hours. Once approved, it will go live across the CareBridge consumer and partner apps.
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                        <button onClick={() => setStep('preview')}
                          style={{ padding: '12px 24px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                          ← Back
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={submitting || cardNo.length < 16 || !cardName || expiry.length < 5 || cvv.length < 3}
                          style={{
                            padding: '12px 32px',
                            background: (cardNo.length >= 16 && cardName && expiry.length >= 5 && cvv.length >= 3 && !submitting) ? '#0D9488' : '#E2E8F0',
                            color: (cardNo.length >= 16 && cardName && expiry.length >= 5 && cvv.length >= 3 && !submitting) ? '#fff' : '#94A3B8',
                            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                            cursor: (cardNo.length >= 16 && cardName && expiry.length >= 5 && cvv.length >= 3 && !submitting) ? 'pointer' : 'not-allowed',
                            fontFamily: 'DM Sans, sans-serif',
                          }}>
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
                <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                  Your ad request has been received. The CareBridge team will review it within 24 hours and notify you once it goes live.
                </div>
                <button onClick={() => { setStep('poster'); setForm(EMPTY); setShowForm(false) }}
                  style={{ padding: '12px 28px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  View My Ads
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}