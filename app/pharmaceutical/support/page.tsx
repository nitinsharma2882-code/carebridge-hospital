'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState, useRef } from 'react';
import axios from '@/lib/api';

interface Ticket { _id: string; subject: string; category: string; status: string; priority: string; createdAt: string; lastReply?: string; }
interface ChatMsg { from: 'user' | 'bot'; text: string; time: string; }

const STATUS_CFG: Record<string,{label:string;bg:string;color:string}> = {
  open:        {label:'Open',        bg:'#DBEAFE',color:'#1E40AF'},
  in_progress: {label:'In Progress', bg:'#FEF3C7',color:'#92400E'},
  resolved:    {label:'Resolved',    bg:'#DCFCE7',color:'#14532D'},
  closed:      {label:'Closed',      bg:'#F1F5F9',color:'#64748B'},
}
const PRIORITY_CFG: Record<string,{label:string;bg:string;color:string}> = {
  low:    {label:'Low',    bg:'#F1F5F9',color:'#64748B'},
  medium: {label:'Medium', bg:'#FEF3C7',color:'#92400E'},
  high:   {label:'High',   bg:'#FEE2E2',color:'#7F1D1D'},
}

const BOT_REPLIES: Record<string, string> = {
  ad:       'Ad approvals take 2-3 business days. If pending longer, raise a ticket under "Ads" with your ad title.',
  order:    'For order or lead queries, check the Orders & Leads page. If data is missing, raise a ticket under "Technical".',
  payment:  'For payment queries, download your ad bill from the Post an Ad page. Raise a ticket under "Billing" for discrepancies.',
  profile:  'To update pharma details, go to Profile and click Save Changes. Clear browser cache if the save fails.',
  support:  'Our support team is available Monday to Saturday, 9 AM to 6 PM IST.',
  default:  'Hello! I can help with ads, orders, payments, and profile issues. What do you need help with?',
}

function getBotReply(msg: string): string {
  const lower = msg.toLowerCase();
  for (const [key, reply] of Object.entries(BOT_REPLIES)) {
    if (key !== 'default' && lower.includes(key)) return reply;
  }
  return BOT_REPLIES.default;
}

export default function PharmaSupport() {
  const [tickets,    setTickets]    = useState<Ticket[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showTicket, setShowTicket] = useState(false);
  const [showChat,   setShowChat]   = useState(false);
  const [activeTab,  setActiveTab]  = useState<'tickets'|'faq'>('tickets');
  const [form,       setForm]       = useState({subject:'',category:'general',priority:'medium',message:''});
  const [saving,     setSaving]     = useState(false);
  const [chatInput,  setChatInput]  = useState('');
  const [chatMsgs,   setChatMsgs]   = useState<ChatMsg[]>([
    {from:'bot',text:"Hello! I'm CareBridge Pharma Support. Ask me about ads, orders, or payments.",time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
  ]);
  const [botTyping,  setBotTyping]  = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get('/api/pharmaceutical/support')
      .then(r => setTickets(r.data?.tickets ?? []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:'smooth'}); }, [chatMsgs, botTyping]);

  const handleCreateTicket = async () => {
    if (!form.subject || !form.message) return;
    setSaving(true);
    try {
      const r = await axios.post('/api/pharmaceutical/support', form);
      const t = r.data?.ticket ?? r.data;
      if (t?._id) setTickets(prev => [t, ...prev]);
      setShowTicket(false);
      setForm({subject:'',category:'general',priority:'medium',message:''});
    } catch { alert('Failed to submit ticket.'); }
    finally { setSaving(false); }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const now = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    const userText = chatInput;
    setChatMsgs(prev => [...prev, {from:'user',text:userText,time:now}]);
    setChatInput('');
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      setChatMsgs(prev => [...prev, {from:'bot',text:getBotReply(userText),time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);
    }, 1000 + Math.random() * 800);
  };

  const inp: React.CSSProperties = {width:'100%',padding:'11px 14px',border:'1.5px solid #E2E8F0',borderRadius:10,fontSize:13,color:'#0F172A',fontFamily:'DM Sans, sans-serif',outline:'none',background:'#fff',boxSizing:'border-box'};
  const lbl: React.CSSProperties = {display:'block',fontSize:11,fontWeight:700,color:'#475569',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'};
  const ACC = '#F97316';

  const FAQS = [
    {q:'How do I post a pharma ad?',            a:'Go to Post an Ad in the sidebar. Follow the 5-step process: poster → details → budget → preview → payment.'},
    {q:'Why is my ad under review?',            a:'All pharma ads are reviewed within 2-3 business days. Once approved, it shows "Live" status.'},
    {q:'How do I view my orders and leads?',    a:'Go to Orders & Leads in the sidebar to view all leads generated via CareBridge.'},
    {q:'How to download my ad bill?',           a:'Go to Post an Ad → click "Bill" next to your campaign to download the billing summary.'},
    {q:'How to cancel a running ad campaign?',  a:'Go to Post an Ad → click "Cancel" on a pending or live ad. The unused balance will be refunded in 5-7 days.'},
  ];

  return (
    <AuthGuard requiredRole="pharmaceutical">
      <div style={{display:'flex',minHeight:'100vh',background:'#F8FAFC'}}>
        <Sidebar />
        <div style={{marginLeft:256,flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
          <TopBar title="Support & Helpdesk" subtitle="Get help, raise tickets, or chat with our team" />

          <div style={{flex:1,padding:24,overflowY:'auto'}}>

            {/* Actions */}
            <div style={{display:'flex',gap:10,marginBottom:20}}>
              <button onClick={()=>setShowChat(true)} style={{padding:'10px 18px',background:ACC,color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans, sans-serif'}}>💬 Live Chat</button>
              <button onClick={()=>setShowTicket(true)} style={{padding:'10px 18px',background:'#0F172A',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans, sans-serif'}}>+ New Ticket</button>
            </div>

            {/* Quick help */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
              {[{icon:'📢',label:'Ad Not Approved',msg:'ad approval'},{icon:'📦',label:'Order Query',msg:'order query'},{icon:'💳',label:'Payment Issue',msg:'payment issue'}].map(item=>(
                <div key={item.label} onClick={()=>{setShowChat(true);setTimeout(()=>setChatInput(item.msg),150)}}
                  style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:12,padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:10}}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor=ACC)}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor='#E2E8F0')}>
                  <span style={{fontSize:20}}>{item.icon}</span>
                  <span style={{fontSize:13,fontWeight:600,color:'#0F172A'}}>{item.label}</span>
                  <span style={{marginLeft:'auto',color:'#94A3B8',fontSize:12}}>→</span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{background:'#fff',borderRadius:16,border:'1px solid #E2E8F0',overflow:'hidden'}}>
              <div style={{display:'flex',borderBottom:'1px solid #E2E8F0'}}>
                {[{key:'tickets',label:`My Tickets (${tickets.length})`},{key:'faq',label:'FAQ'}].map(t=>(
                  <button key={t.key} onClick={()=>setActiveTab(t.key as 'tickets'|'faq')}
                    style={{flex:1,padding:'14px 20px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:activeTab===t.key?700:500,color:activeTab===t.key?ACC:'#94A3B8',borderBottom:activeTab===t.key?`2.5px solid ${ACC}`:'2.5px solid transparent',fontFamily:'DM Sans, sans-serif'}}>
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab==='tickets' && (
                loading ? <div style={{textAlign:'center',padding:40,color:'#94A3B8',fontSize:14}}>Loading...</div>
                : tickets.length===0 ? (
                  <div style={{textAlign:'center',padding:60}}>
                    <div style={{fontSize:40,marginBottom:12}}>🎫</div>
                    <div style={{fontSize:15,fontWeight:600,color:'#0F172A',marginBottom:8}}>No tickets yet</div>
                    <div style={{fontSize:13,color:'#64748B',marginBottom:20}}>Raise a ticket or use Live Chat for quick help</div>
                    <button onClick={()=>setShowTicket(true)} style={{padding:'10px 24px',background:ACC,color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans, sans-serif'}}>+ Raise a Ticket</button>
                  </div>
                ) : (
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr style={{background:'#F8FAFC'}}>{['Subject','Category','Priority','Status','Last Updated'].map(h=><th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'0.4px'}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {tickets.map(t=>{
                        const sc=STATUS_CFG[t.status]||STATUS_CFG.open;
                        const pc=PRIORITY_CFG[t.priority]||PRIORITY_CFG.medium;
                        return (
                          <tr key={t._id} style={{borderTop:'1px solid #F1F5F9'}}>
                            <td style={{padding:'12px 16px',fontWeight:600,color:'#0F172A'}}>{t.subject}</td>
                            <td style={{padding:'12px 16px',color:'#64748B',textTransform:'capitalize'}}>{t.category}</td>
                            <td style={{padding:'12px 16px'}}><span style={{background:pc.bg,color:pc.color,fontSize:11,fontWeight:700,borderRadius:20,padding:'3px 10px'}}>{pc.label}</span></td>
                            <td style={{padding:'12px 16px'}}><span style={{background:sc.bg,color:sc.color,fontSize:11,fontWeight:700,borderRadius:20,padding:'3px 10px'}}>{sc.label.replace('_',' ')}</span></td>
                            <td style={{padding:'12px 16px',color:'#64748B'}}>{new Date(t.lastReply||t.createdAt).toLocaleDateString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              )}

              {activeTab==='faq' && (
                <div style={{padding:24}}>
                  {FAQS.map((faq,i)=>(
                    <details key={i} style={{marginBottom:12,border:'1px solid #E2E8F0',borderRadius:10,overflow:'hidden'}}>
                      <summary style={{padding:'12px 16px',cursor:'pointer',fontSize:13,fontWeight:600,color:'#0F172A',listStyle:'none',display:'flex',alignItems:'center',justifyContent:'space-between'}}>{faq.q}<span style={{color:'#94A3B8'}}>▾</span></summary>
                      <div style={{padding:'12px 16px',borderTop:'1px solid #F1F5F9',fontSize:13,color:'#475569',lineHeight:1.6}}>{faq.a}</div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showTicket && (
        <div onClick={()=>setShowTicket(false)} style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:20,width:'100%',maxWidth:500,boxShadow:'0 24px 80px rgba(0,0,0,0.3)'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid #E2E8F0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:16,fontWeight:800,color:'#0F172A'}}>Raise a Support Ticket</div>
              <button onClick={()=>setShowTicket(false)} style={{width:32,height:32,borderRadius:8,background:'#F1F5F9',border:'none',cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <div style={{padding:24}}>
              <div style={{marginBottom:16}}><label style={lbl}>Issue Title *</label><input style={inp} placeholder="Brief description" value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <div><label style={lbl}>Category</label><select style={inp} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>{['general','billing','technical','ads','orders','profile','other'].map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></div>
                <div><label style={lbl}>Priority</label><select style={inp} value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              </div>
              <div style={{marginBottom:20}}><label style={lbl}>Describe the Issue *</label><textarea style={{...inp,height:100,resize:'vertical'}} placeholder="Provide as much detail as possible..." value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))}/></div>
              <div style={{display:'flex',gap:12}}>
                <button onClick={()=>setShowTicket(false)} style={{flex:1,padding:12,background:'#F1F5F9',color:'#475569',border:'none',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans, sans-serif'}}>Cancel</button>
                <button onClick={handleCreateTicket} disabled={saving||!form.subject||!form.message} style={{flex:1,padding:12,background:saving?'#94A3B8':ACC,color:'#fff',border:'none',borderRadius:12,fontSize:13,fontWeight:600,cursor:saving?'not-allowed':'pointer',fontFamily:'DM Sans, sans-serif'}}>{saving?'Submitting...':'Submit Ticket'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Chat Widget */}
      {showChat && (
        <div style={{position:'fixed',bottom:24,right:24,width:360,background:'#fff',borderRadius:20,boxShadow:'0 8px 40px rgba(15,23,42,0.2)',zIndex:300,display:'flex',flexDirection:'column',overflow:'hidden',border:'1px solid #E2E8F0',height:480}}>
          <div style={{background:`linear-gradient(135deg,${ACC},#ea580c)`,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🤝</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>CareBridge Pharma Support</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.8)',display:'flex',alignItems:'center',gap:4}}><div style={{width:6,height:6,borderRadius:'50%',background:'#4ade80'}}/> Online now</div>
              </div>
            </div>
            <button onClick={()=>setShowChat(false)} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:8,width:28,height:28,cursor:'pointer',color:'#fff',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
            {chatMsgs.map((msg,i)=>(
              <div key={i} style={{display:'flex',justifyContent:msg.from==='user'?'flex-end':'flex-start'}}>
                <div style={{maxWidth:'80%',borderRadius:msg.from==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',padding:'10px 14px',fontSize:13,lineHeight:1.5,background:msg.from==='user'?ACC:'#F1F5F9',color:msg.from==='user'?'#fff':'#0F172A'}}>
                  <div>{msg.text}</div>
                  <div style={{fontSize:10,marginTop:4,opacity:0.7,textAlign:'right'}}>{msg.time}</div>
                </div>
              </div>
            ))}
            {botTyping && (
              <div style={{display:'flex',justifyContent:'flex-start'}}>
                <div style={{background:'#F1F5F9',borderRadius:'16px 16px 16px 4px',padding:'12px 16px',display:'flex',gap:4}}>
                  {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:'#94A3B8',animation:'bounce 1s infinite',animationDelay:`${i*0.2}s`}}/>)}
                </div>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>
          <div style={{padding:'12px 16px',borderTop:'1px solid #E2E8F0',display:'flex',gap:8}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendChat()} placeholder="Type your message..."
              style={{flex:1,padding:'8px 14px',border:'1.5px solid #E2E8F0',borderRadius:10,fontSize:13,color:'#0F172A',fontFamily:'DM Sans, sans-serif',outline:'none'}}/>
            <button onClick={sendChat} disabled={!chatInput.trim()} style={{padding:'8px 16px',background:chatInput.trim()?ACC:'#E2E8F0',color:chatInput.trim()?'#fff':'#94A3B8',border:'none',borderRadius:10,fontSize:12,fontWeight:600,cursor:chatInput.trim()?'pointer':'not-allowed',fontFamily:'DM Sans, sans-serif'}}>Send</button>
          </div>
          <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
        </div>
      )}
    </AuthGuard>
  );
}
