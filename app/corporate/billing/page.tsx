'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import { CorporateAPI } from '@/lib/api';

interface Invoice { _id:string; month:string; employees:number; bookings:number; amount:number; status:string; }
interface Plan { name:string; price:number; employees:number; features:string[]; }

export default function CorporateBilling() {
  const [plan,     setPlan]     = useState<Plan|null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    CorporateAPI.getBilling()
      .then(r => { setPlan(r.data?.plan); setInvoices(r.data?.invoices??[]); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  const downloadInvoice = (inv: Invoice) => {
    const lines = ['CAREBRIDGE CORPORATE INVOICE','='.repeat(40),`Month: ${inv.month}`,`Employees: ${inv.employees}`,`Bookings: ${inv.bookings}`,`Amount: ₹${inv.amount.toLocaleString()}`,`Status: ${inv.status}`].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines], {type:'text/plain'}));
    a.download = `carebridge-invoice-${inv.month.replace(' ','-')}.txt`;
    a.click();
  };

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Billing & Subscription" subtitle="Your plan, usage, and invoices" />
          <div className="p-6 space-y-6">
            {loading ? <div className="text-center py-16 text-gray-500">Loading billing...</div> : (
              <>
                {/* Plan card */}
                {plan && (
                  <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl p-6 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium opacity-80 mb-1">Current Plan</div>
                        <div className="text-2xl font-bold mb-1">{plan.name}</div>
                        <div className="text-3xl font-black">₹{plan.price?.toLocaleString()}<span className="text-base font-normal opacity-80">/month</span></div>
                      </div>
                      <div className="bg-white/20 rounded-xl px-4 py-2 text-sm font-semibold">Active</div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {plan.features?.map((f,i) => <div key={i} className="flex items-center gap-2 text-sm opacity-90"><span>✓</span>{f}</div>)}
                    </div>
                  </div>
                )}

                {/* Invoices */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-800">
                    <h3 className="text-white font-semibold">Invoice History</h3>
                  </div>
                  {invoices.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No invoices yet</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-800">
                        {['Month','Employees','Bookings','Amount','Status','Action'].map(h=>(
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody className="divide-y divide-gray-800">
                        {invoices.map(inv => (
                          <tr key={inv._id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 text-white font-medium">{inv.month}</td>
                            <td className="px-4 py-3 text-gray-400">{inv.employees}</td>
                            <td className="px-4 py-3 text-gray-400">{inv.bookings}</td>
                            <td className="px-4 py-3 text-white font-bold">₹{inv.amount?.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${inv.status==='paid'?'bg-emerald-500/20 text-emerald-400':'bg-yellow-500/20 text-yellow-400'}`}>{inv.status}</span>
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={()=>downloadInvoice(inv)} className="text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 px-3 py-1 rounded-lg transition">Download</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
