'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import AuthGuard from '@/components/AuthGuard'
import axios from '@/lib/api'

type Step = 'poster' | 'details' | 'content' | 'preview' | 'payment' | 'done'

interface AdForm {
  title: string; subtitle: string; ctaText: string
  badge: string; gradientFrom: string; gradientTo: string
  targetUrl: string; budget: number; message: string
}

const EMPTY: AdForm = {
  title: '', subtitle: '', ctaText: 'Learn More',
  badge: 'SPONSORED', gradientFrom: '#f97316', gradientTo: '#ea580c',
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
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Under Review', bg: '#FEF3C7', color: '#92400E' },
  approved:  { label: 'Live',         bg: '#DCFCE7', color: '#14532D' },
  rejected:  { label: 'Rejected',     bg: '#FEE2E2', color: '#7F1D1D' },
  cancelled: { label: 'Cancelled',    bg: '#F1F5F9', color: '#64748B' },
}

function calcRefund(ad: Ad) {
  const budget = BUDGETS.find(b => b.amount === ad.budget) || BUDGETS[1]
  const daysRun = Math.max(0, Math.floor((Date.now() - new Date(ad.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
  const totalDays = budget.days
  const amountSpent = Math.min(ad.budget, Math.round((ad.budget / totalDays) * daysRun))
  return { daysRun: Math.min(daysRun, totalDays), totalDays, amountSpent, refund: Math.max(0, ad.budget - amountSpent) }
}

function downloadAdBill(ad: Ad) {
  const budget = BUDGETS.find(b => b.amount === ad.budget) || BUDGETS[1]
  const { daysRun, totalDays, amountSpent, refund } = calcRefund(ad)
  const lines = ['═══════════════════════════════════════════', '      CAREBRIDGE PHARMA AD CAMPAIGN BILL', '═══════════════════════════════════════════', `Ad Title:     ${ad.title}`, `Campaign ID:  ${ad._id.slice(-8).toUpperCase()}`, `Status:       ${STATUS_CFG[ad.status]?.label || ad.status}`, `Plan:         ${budget.label}`, `Duration:     ${budget.days} days`, `Submitted:    ${new Date(ad.createdAt).toLocaleDateString('en-IN')}`, '', `Total Amount: Rs. ${ad.budget.toLocaleString()}`, `Days Run:     ${daysRun} of ${totalDays}`, `Amount Spent: Rs. ${amountSpent.toLocaleString()}`, `Refund:       Rs. ${refund.toLocaleString()}`, '═══════════════════════════════════════════', 'CareBridge Healthcare Platform'].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([lines], { type: 'text/plain' }))
  a.download = `carebridge-pharma-ad-bill-${ad._id.slice(-8)}.txt`
  a.click()
}

export default function PharmaAdsPage() {
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
  const [detailAd,   setDetailAd]   = useState<Ad | null>(null)
  const [cancelAd,   setCancelAd]   = useState<Ad | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)

  useEffect(() => {
    axios.get('/api/pharmaceutical/ads')
      .then(r => setAds(r.data?.ads || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const up = (k: keyof AdForm, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await axios.post('/api/pharmaceutical/ads', form)
      const r = await axios.get('/api/pharmaceutical/ads')
      setAds(r.data?.ads || [])
      setStep('done')
    } catch { alert('Failed to submit. Please try again.') }
    finally { setSubmitting(false) }
  }

  const handleCancel = async () => {
    if (!cancelAd) return
    setCancelling(true)
    setAds(prev => prev.map(a => a._id === cancelAd._id ? { ...a, status: 'cancelled' } : a))
    setCancelDone(true)
    setTimeout(() => { setCancelDone(false); setCancelAd(null) }, 3000)
    setCancelling(false)
  }

  const stepIdx = STEP_ORDER.indexOf(step)
  const selectedBudget = BUDGETS.find(b => b.amount === form.budget) || BUDGETS[1]
  const STEPS_META = [{ key: 'poster', label: 'Ad Poster' }, { key: 'details', label: 'Ad Details' }, { key: 'content', label: 'Content' }, { key: 'preview', label: 'Preview' }, { key: 'payment', label: 'Payment' }]

  const AdPreview = ({ a, small }: { a: AdForm | Ad; small?: boolean }) => {
    const gF = (a as AdForm).gradientFrom || (a as Ad).gradientFrom || '#f97316'
    const gT = (a as AdForm).gradientTo   || (a as Ad).gradientTo   || '#ea580c'
    const ct = (a as AdForm).ctaText      || (a as Ad).ctaText      || 'Learn More'
    return (
      <div style={{ borderRadius: 20, overflow: 'hidden', width: small ? 220 : 280, background: `linear-gradient(135deg,${gF},${gT})` }}>
        <div style={{ padding: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', borderRadius: 20, padding: '2px 10px', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>{a.badge || 'SPONSORED'}</div>
          <div style={{ fontSize: small ? 13 : 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{a.title || 'Your Pharma Brand'}</div>
          <div style={{ fontSize: small ? 10 : 11, color: 'rgba(255,255,255,0.75)', marginBottom: 12 }}>{a.subtitle || 'Your tagline here'}</div>
          <div style={{ display: 'inline-block', background: '#fff', borderRadius: 8, padding: '5px 12px', fontSize: 9, fontWeight: 700, color: gF }}>{ct} →</div>
        </div>
      </div>
    )
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }
  const ACC = '#F97316'

  return (
    <AuthGuard requiredRole="pharmaceutical">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Post an Ad" subtitle="Reach doctors and patients across India" />

          <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: '#F8FAFC' }}>

            {/* Existing ads */}
            {ads.length > 0 && !showForm && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>My Ad Campaigns</div>
                  <button onClick={() => { setStep('poster'); setForm(EMPTY); setShowForm(true) }} style={{ padding: '8px 16px', background: ACC, color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>+ New Ad</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ background: '#F8FAFC' }}>{['Campaign','Badge','Budget','Submitted','Status','Actions'].map(h=><th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {ads.map(ad => {
                        const cfg = STATUS_CFG[ad.status] || STATUS_CFG.pending
                        const budget = BUDGETS.find(b => b.amount === ad.budget) || BUDGETS[1]
                        return (
                          <tr key={ad._id} style={{ borderTop: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <button onClick={() => setDetailAd(ad)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: ACC, textDecoration: 'underline', marginBottom: 2 }}>{ad.title}</div>
                                <div style={{ fontSize: 11, color: '#94A3B8' }}>{budget.label} · {budget.days} days</div>
                              </button>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#64748B' }}>{ad.badge}</td>
                            <td style={{ padding: '12px 16px', color: ACC, fontWeight: 700, whiteSpace: 'nowrap' }}>Rs. {ad.budget?.toLocaleString()}</td>
                            <td style={{ padding: '12px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(ad.createdAt).toLocaleDateString('en-IN')}</td>
                            <td style={{ padding: '12px 16px' }}><span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px' }}>{cfg.label}</span></td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => setDetailAd(ad)} style={{ padding: '5px 10px', background: '#FFF7ED', color: '#c2410c', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Details</button>
                                <button onClick={() => downloadAdBill(ad)} style={{ padding: '5px 10px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Bill</button>
                                {['pending','approved'].includes(ad.status) && <button onClick={() => setCancelAd(ad)} style={{ padding: '5px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>}
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

            {/* Ad form */}
            {(showForm || ads.length === 0) && step !== 'done' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                {/* Steps */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {STEPS_META.map((s, i) => (
                      <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS_META.length-1 ? 1 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: i<=stepIdx ? ACC : '#F1F5F9', color: i<=stepIdx ? '#fff' : '#94A3B8' }}>{i<stepIdx?'✓':i+1}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: i<=stepIdx ? ACC : '#94A3B8', whiteSpace: 'nowrap' }}>{s.label}</div>
                        </div>
                        {i < STEPS_META.length-1 && <div style={{ flex: 1, height: 2, background: i<stepIdx ? ACC : '#E2E8F0', margin: '0 8px', marginBottom: 16 }} />}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 28 }}>
                  {/* STEP 1 */}
                  {step === 'poster' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Design your ad poster</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Choose colors and badge for your pharma ad</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                          <div style={{ marginBottom: 16 }}><label style={lbl}>Badge Text</label><select value={form.badge} onChange={e=>up('badge',e.target.value)} style={{...inp}}><option>SPONSORED</option><option>NEW LAUNCH</option><option>OFFER</option><option>APPROVED</option><option>GENERIC</option></select></div>
                          <div style={{ marginBottom: 16 }}><label style={lbl}>Start Color</label><div style={{ display: 'flex', gap: 8 }}><input type="color" value={form.gradientFrom} onChange={e=>up('gradientFrom',e.target.value)} style={{ width:44,height:36,border:'1.5px solid #E2E8F0',borderRadius:8,cursor:'pointer',padding:2 }}/><input style={{...inp,flex:1}} value={form.gradientFrom} onChange={e=>up('gradientFrom',e.target.value)}/></div></div>
                          <div style={{ marginBottom: 16 }}><label style={lbl}>End Color</label><div style={{ display: 'flex', gap: 8 }}><input type="color" value={form.gradientTo} onChange={e=>up('gradientTo',e.target.value)} style={{ width:44,height:36,border:'1.5px solid #E2E8F0',borderRadius:8,cursor:'pointer',padding:2 }}/><input style={{...inp,flex:1}} value={form.gradientTo} onChange={e=>up('gradientTo',e.target.value)}/></div></div>
                        </div>
                        <div><label style={lbl}>Live Preview</label><AdPreview a={form}/></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}><button onClick={()=>setStep('details')} style={{ padding:'12px 28px',background:ACC,color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>Next: Ad Details →</button></div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {step === 'details' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Ad Details</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Fill in title, subtitle and call-to-action</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div style={{ display: 'grid', gap: 16 }}>
                          <div><label style={lbl}>Brand / Product Title *</label><input style={inp} placeholder="e.g. MediLife Paracetamol 500mg" value={form.title} onChange={e=>up('title',e.target.value)}/></div>
                          <div><label style={lbl}>Subtitle</label><input style={inp} placeholder="e.g. Fast relief, doctor recommended" value={form.subtitle} onChange={e=>up('subtitle',e.target.value)}/></div>
                          <div><label style={lbl}>Call to Action</label><select value={form.ctaText} onChange={e=>up('ctaText',e.target.value)} style={inp}><option>Learn More</option><option>Order Now</option><option>Contact Us</option><option>Get Sample</option><option>View Details</option></select></div>
                          <div><label style={lbl}>Website (optional)</label><input style={inp} placeholder="https://yourpharma.com" value={form.targetUrl} onChange={e=>up('targetUrl',e.target.value)}/></div>
                        </div>
                        <div><label style={lbl}>Live Preview</label><AdPreview a={form}/><div style={{ fontSize:11,color:'#94A3B8',marginTop:8 }}>Updates as you type</div></div>
                      </div>
                      <div style={{ display:'flex',gap:12,justifyContent:'flex-end',marginTop:24 }}>
                        <button onClick={()=>setStep('poster')} style={{ padding:'12px 24px',background:'#F1F5F9',color:'#475569',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>← Back</button>
                        <button onClick={()=>setStep('content')} disabled={!form.title} style={{ padding:'12px 28px',background:form.title?ACC:'#E2E8F0',color:form.title?'#fff':'#94A3B8',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:form.title?'pointer':'not-allowed',fontFamily:'DM Sans, sans-serif' }}>Next: Content →</button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 */}
                  {step === 'content' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Content & Budget</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Add a message and choose your plan</div>
                      <div style={{ marginBottom: 20 }}><label style={lbl}>Message to CareBridge Team</label><textarea placeholder="Describe your product, target audience, and special instructions..." value={form.message} onChange={e=>up('message',e.target.value)} style={{...inp,height:100,resize:'none'} as React.CSSProperties}/></div>
                      <div style={{ marginBottom: 24 }}>
                        <label style={lbl}>Select Budget Plan</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                          {BUDGETS.map(b=><div key={b.amount} onClick={()=>up('budget',b.amount)} style={{ border:`2px solid ${form.budget===b.amount?ACC:'#E2E8F0'}`,borderRadius:12,padding:14,cursor:'pointer',background:form.budget===b.amount?'#FFF7ED':'#fff',transition:'all 0.15s' }}><div style={{ fontSize:12,fontWeight:700,color:form.budget===b.amount?ACC:'#64748B',marginBottom:4 }}>{b.label}</div><div style={{ fontSize:18,fontWeight:900,color:'#0F172A',letterSpacing:'-0.5px' }}>Rs.{b.amount.toLocaleString()}</div><div style={{ fontSize:11,color:'#64748B',marginTop:4 }}>{b.reach}</div><div style={{ fontSize:11,color:'#94A3B8',marginTop:2 }}>{b.days} days</div></div>)}
                        </div>
                      </div>
                      <div style={{ display:'flex',gap:12,justifyContent:'flex-end' }}>
                        <button onClick={()=>setStep('details')} style={{ padding:'12px 24px',background:'#F1F5F9',color:'#475569',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>← Back</button>
                        <button onClick={()=>setStep('preview')} style={{ padding:'12px 28px',background:ACC,color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>Preview Ad →</button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4 */}
                  {step === 'preview' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Preview Your Ad</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>This is how your ad appears in the CareBridge app</div>
                      <div style={{ background:'#F8FAFC',borderRadius:16,padding:20,marginBottom:24,border:'1px solid #E2E8F0' }}>
                        <div style={{ fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:12 }}>Featured & Sponsored</div>
                        <AdPreview a={form}/>
                      </div>
                      <div style={{ background:'#F8FAFC',borderRadius:12,padding:16,marginBottom:24,border:'1px solid #E2E8F0' }}>
                        <div style={{ fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:12 }}>Ad Summary</div>
                        {[{label:'Title',value:form.title},{label:'Subtitle',value:form.subtitle||'Not set'},{label:'CTA',value:form.ctaText},{label:'Plan',value:`${selectedBudget.label} — Rs. ${selectedBudget.amount.toLocaleString()}`},{label:'Reach',value:selectedBudget.reach},{label:'Duration',value:`${selectedBudget.days} days`}].map((r,i)=><div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<5?'1px solid #E2E8F0':'none' }}><span style={{ fontSize:13,color:'#64748B' }}>{r.label}</span><span style={{ fontSize:13,fontWeight:600,color:'#0F172A' }}>{r.value}</span></div>)}
                        <div style={{ display:'flex',justifyContent:'space-between',marginTop:12,paddingTop:12,borderTop:'2px solid #E2E8F0' }}><span style={{ fontSize:15,fontWeight:700,color:'#0F172A' }}>Total</span><span style={{ fontSize:18,fontWeight:900,color:ACC }}>Rs. {selectedBudget.amount.toLocaleString()}</span></div>
                      </div>
                      <div style={{ display:'flex',gap:12,justifyContent:'flex-end' }}>
                        <button onClick={()=>setStep('content')} style={{ padding:'12px 24px',background:'#F1F5F9',color:'#475569',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>← Edit</button>
                        <button onClick={()=>setStep('payment')} style={{ padding:'12px 28px',background:ACC,color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>Proceed to Payment →</button>
                      </div>
                    </div>
                  )}

                  {/* STEP 5 */}
                  {step === 'payment' && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Payment</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Complete payment to submit your ad for review</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                          <div style={{ background:'linear-gradient(135deg,#7c2d12,#c2410c)',borderRadius:16,padding:20,marginBottom:20,color:'#fff' }}>
                            <div style={{ fontSize:11,opacity:0.5,marginBottom:20 }}>CAREBRIDGE PHARMA ADVERTISING</div>
                            <div style={{ fontSize:18,fontWeight:700,letterSpacing:4,marginBottom:20 }}>{cardNo?cardNo.replace(/(\d{4})/g,'$1 ').trim():'•••• •••• •••• ••••'}</div>
                            <div style={{ display:'flex',justifyContent:'space-between',fontSize:12 }}>
                              <div><div style={{ opacity:0.5,marginBottom:2 }}>Card Holder</div><div style={{ fontWeight:600 }}>{cardName||'YOUR NAME'}</div></div>
                              <div><div style={{ opacity:0.5,marginBottom:2 }}>Expires</div><div style={{ fontWeight:600 }}>{expiry||'MM/YY'}</div></div>
                            </div>
                          </div>
                          <div style={{ display:'grid',gap:12 }}>
                            <div><label style={lbl}>Card Number</label><input style={inp} placeholder="1234 5678 9012 3456" maxLength={16} value={cardNo} onChange={e=>setCardNo(e.target.value.replace(/\D/g,'').slice(0,16))}/></div>
                            <div><label style={lbl}>Cardholder Name</label><input style={inp} placeholder="As on card" value={cardName} onChange={e=>setCardName(e.target.value)}/></div>
                            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                              <div><label style={lbl}>Expiry</label><input style={inp} placeholder="MM/YY" maxLength={5} value={expiry} onChange={e=>{let v=e.target.value.replace(/\D/g,'');if(v.length>=2)v=v.slice(0,2)+'/'+v.slice(2);setExpiry(v.slice(0,5))}}/></div>
                              <div><label style={lbl}>CVV</label><input style={inp} placeholder="•••" maxLength={3} type="password" value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,'').slice(0,3))}/></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div style={{ background:'#F8FAFC',borderRadius:16,padding:20,border:'1px solid #E2E8F0' }}>
                            <div style={{ fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:16 }}>Order Summary</div>
                            {[{label:'Campaign',value:form.title},{label:'Plan',value:selectedBudget.label},{label:'Duration',value:`${selectedBudget.days} days`},{label:'Reach',value:selectedBudget.reach}].map((r,i)=><div key={i} style={{ display:'flex',justifyContent:'space-between',marginBottom:10 }}><span style={{ fontSize:13,color:'#64748B' }}>{r.label}</span><span style={{ fontSize:13,fontWeight:600,color:i===3?ACC:'#0F172A' }}>{r.value}</span></div>)}
                            <div style={{ borderTop:'2px solid #E2E8F0',marginTop:12,paddingTop:12,display:'flex',justifyContent:'space-between' }}><span style={{ fontSize:15,fontWeight:700,color:'#0F172A' }}>Total</span><span style={{ fontSize:20,fontWeight:900,color:ACC }}>Rs. {selectedBudget.amount.toLocaleString()}</span></div>
                          </div>
                          <div style={{ background:'#FFF7ED',borderRadius:12,padding:14,marginTop:12,border:`1px solid ${ACC}40` }}>
                            <div style={{ fontSize:12,color:'#9a3412',lineHeight:1.5 }}>Your ad will be reviewed within 24 hours. Unused balance refunded on cancellation.</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display:'flex',gap:12,justifyContent:'flex-end',marginTop:24 }}>
                        <button onClick={()=>setStep('preview')} style={{ padding:'12px 24px',background:'#F1F5F9',color:'#475569',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>← Back</button>
                        <button onClick={handleSubmit} disabled={submitting||cardNo.length<16||!cardName||expiry.length<5||cvv.length<3}
                          style={{ padding:'12px 32px',background:(cardNo.length>=16&&cardName&&expiry.length>=5&&cvv.length>=3&&!submitting)?ACC:'#E2E8F0',color:(cardNo.length>=16&&cardName&&expiry.length>=5&&cvv.length>=3&&!submitting)?'#fff':'#94A3B8',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:(cardNo.length>=16&&cardName&&expiry.length>=5&&cvv.length>=3&&!submitting)?'pointer':'not-allowed',fontFamily:'DM Sans, sans-serif' }}>
                          {submitting?'Submitting...':`Pay Rs. ${selectedBudget.amount.toLocaleString()} & Submit`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Done */}
            {step === 'done' && (
              <div style={{ background:'#fff',borderRadius:16,border:'1px solid #E2E8F0',padding:48,textAlign:'center' }}>
                <div style={{ width:64,height:64,borderRadius:'50%',background:'#FFF7ED',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:28 }}>✓</div>
                <div style={{ fontSize:22,fontWeight:900,color:'#0F172A',marginBottom:8 }}>Ad Submitted!</div>
                <div style={{ fontSize:14,color:'#64748B',marginBottom:24,maxWidth:400,margin:'0 auto 24px' }}>Your pharma ad has been received. The CareBridge team will review it within 24 hours.</div>
                <button onClick={()=>{setStep('poster');setForm(EMPTY);setShowForm(false)}} style={{ padding:'12px 28px',background:ACC,color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>View My Ads</button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {detailAd && (() => {
        const cfg = STATUS_CFG[detailAd.status]||STATUS_CFG.pending
        const budget = BUDGETS.find(b=>b.amount===detailAd.budget)||BUDGETS[1]
        const {daysRun,totalDays,amountSpent,refund}=calcRefund(detailAd)
        return (
          <div onClick={()=>setDetailAd(null)} style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:24,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>
              <div style={{ padding:'20px 24px',borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <div><div style={{ fontSize:17,fontWeight:800,color:'#0F172A' }}>{detailAd.title}</div><div style={{ fontSize:12,color:'#64748B',marginTop:2 }}>ID: {detailAd._id.slice(-8).toUpperCase()}</div></div>
                <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                  <span style={{ background:cfg.bg,color:cfg.color,fontSize:12,fontWeight:700,borderRadius:20,padding:'4px 12px' }}>{cfg.label}</span>
                  <button onClick={()=>setDetailAd(null)} style={{ width:32,height:32,borderRadius:8,background:'#F1F5F9',border:'none',cursor:'pointer',fontSize:16 }}>✕</button>
                </div>
              </div>
              <div style={{ padding:24,display:'grid',gap:20 }}>
                <div><div style={{ fontSize:12,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:10 }}>Ad Preview</div><AdPreview a={detailAd} small/></div>
                <div style={{ background:'#F8FAFC',borderRadius:12,padding:16,border:'1px solid #E2E8F0' }}>
                  <div style={{ fontSize:13,fontWeight:700,color:'#0F172A',marginBottom:12 }}>Campaign Progress</div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}><span style={{ fontSize:12,color:'#64748B' }}>Day {daysRun} of {totalDays}</span><span style={{ fontSize:12,fontWeight:700,color:ACC }}>{Math.min(100,Math.round((daysRun/totalDays)*100))}%</span></div>
                  <div style={{ background:'#E2E8F0',borderRadius:6,height:8,overflow:'hidden' }}><div style={{ width:`${Math.min(100,Math.round((daysRun/totalDays)*100))}%`,height:'100%',background:`linear-gradient(90deg,${ACC},#fb923c)`,borderRadius:6 }}/></div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginTop:14 }}>
                    {[{label:'Total Budget',value:`Rs. ${detailAd.budget.toLocaleString()}`},{label:'Spent',value:`Rs. ${amountSpent.toLocaleString()}`},{label:'Refund if Cancel',value:`Rs. ${refund.toLocaleString()}`}].map((r,i)=>(
                      <div key={i} style={{ background:'#fff',borderRadius:8,padding:10,border:'1px solid #E2E8F0',textAlign:'center' }}>
                        <div style={{ fontSize:10,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',marginBottom:4 }}>{r.label}</div>
                        <div style={{ fontSize:13,fontWeight:700,color:'#0F172A' }}>{r.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex',gap:10 }}>
                  <button onClick={()=>downloadAdBill(detailAd)} style={{ flex:1,padding:12,background:'#F1F5F9',color:'#475569',border:'none',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>⬇ Download Bill</button>
                  {['pending','approved'].includes(detailAd.status)&&<button onClick={()=>{setDetailAd(null);setCancelAd(detailAd)}} style={{ flex:1,padding:12,background:'#FEE2E2',color:'#DC2626',border:'none',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>Cancel Subscription</button>}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Cancel Modal */}
      {cancelAd && (() => {
        const {daysRun,totalDays,amountSpent,refund}=calcRefund(cancelAd)
        return (
          <div onClick={()=>!cancelling&&setCancelAd(null)} style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:24,width:'100%',maxWidth:460,boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>
              <div style={{ padding:'20px 24px',borderBottom:'1px solid #E2E8F0' }}><div style={{ fontSize:16,fontWeight:800,color:'#DC2626' }}>Cancel Ad Subscription</div><div style={{ fontSize:12,color:'#64748B',marginTop:2 }}>{cancelAd.title}</div></div>
              <div style={{ padding:24 }}>
                {cancelDone ? (
                  <div style={{ textAlign:'center',padding:20 }}>
                    <div style={{ fontSize:40,marginBottom:12 }}>✅</div>
                    <div style={{ fontSize:16,fontWeight:700,color:'#0F172A',marginBottom:8 }}>Subscription Cancelled</div>
                    <div style={{ background:'#DCFCE7',borderRadius:12,padding:16,border:'1px solid #BBF7D0' }}>
                      <div style={{ fontSize:12,color:'#15803D',fontWeight:600,marginBottom:4 }}>Refund Initiated</div>
                      <div style={{ fontSize:22,fontWeight:900,color:'#14532D' }}>Rs. {refund.toLocaleString()}</div>
                      <div style={{ fontSize:12,color:'#15803D',marginTop:4 }}>Credited within 5-7 business days</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ background:'#F8FAFC',borderRadius:12,padding:16,marginBottom:20,border:'1px solid #E2E8F0' }}>
                      {[{label:'Total Plan',value:`Rs. ${cancelAd.budget.toLocaleString()}`,color:'#0F172A'},{label:'Days Run',value:`${daysRun} of ${totalDays}`,color:'#64748B'},{label:'Amount Charged',value:`Rs. ${amountSpent.toLocaleString()}`,color:'#DC2626'},{label:'Refund',value:`Rs. ${refund.toLocaleString()}`,color:'#16A34A'}].map((r,i)=>(
                        <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<3?'1px solid #E2E8F0':'none' }}><span style={{ fontSize:13,color:'#64748B' }}>{r.label}</span><span style={{ fontSize:13,fontWeight:700,color:r.color }}>{r.value}</span></div>
                      ))}
                    </div>
                    <div style={{ background:'#FEF3C7',borderRadius:10,padding:12,marginBottom:20,fontSize:12,color:'#92400E',lineHeight:1.5 }}>⚠️ Ad stops immediately. Refund of <strong>Rs. {refund.toLocaleString()}</strong> processed in 5-7 business days.</div>
                    <div style={{ display:'flex',gap:12 }}>
                      <button onClick={()=>setCancelAd(null)} style={{ flex:1,padding:12,background:'#F1F5F9',color:'#475569',border:'none',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>Keep Running</button>
                      <button onClick={handleCancel} disabled={cancelling} style={{ flex:1,padding:12,background:cancelling?'#94A3B8':'#DC2626',color:'#fff',border:'none',borderRadius:12,fontSize:13,fontWeight:700,cursor:cancelling?'not-allowed':'pointer',fontFamily:'DM Sans, sans-serif' }}>{cancelling?'Cancelling...':'Cancel & Refund'}</button>
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
