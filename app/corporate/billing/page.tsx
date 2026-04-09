'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';

interface Invoice {
  _id: string;
  month: string;
  employees: number;
  bookings: number;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

interface Plan {
  name: string;
  price: number;
  employees: number;
  features: string[];
  current: boolean;
}

const ALL_PLANS = [
  { name: 'Starter',      price: 2999,  employees: 25,    color: 'border-gray-700',    badge: '',             features: ['Up to 25 employees', 'Basic bookings', 'Email support', 'Monthly reports'] },
  { name: 'Professional', price: 5999,  employees: 100,   color: 'border-violet-500',  badge: 'Most Popular', features: ['Up to 100 employees', 'Unlimited bookings', 'Health event creation', 'Analytics dashboard', 'Priority support'] },
  { name: 'Business',     price: 11999, employees: 500,   color: 'border-blue-500',    badge: 'Best Value',   features: ['Up to 500 employees', 'Family member coverage', 'Dedicated account manager', 'Custom health events', 'Advanced analytics', '24/7 support'] },
  { name: 'Enterprise',   price: 24999, employees: 99999, color: 'border-emerald-500', badge: 'Enterprise',   features: ['Unlimited employees', 'Full family coverage', 'White-label portal', 'API access', 'Custom integrations', 'SLA guarantee', 'Dedicated support team'] },
];

const statusColor: Record<string, string> = {
  paid:    'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  overdue: 'bg-red-500/20 text-red-400',
};

const MOCK_INVOICES: Invoice[] = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(); d.setMonth(d.getMonth() - i);
  return { _id: `inv_${i}`, month: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }), employees: 42, bookings: Math.floor(Math.random() * 20) + 5, amount: 7057, status: i === 0 ? 'pending' : 'paid' };
});

export default function CorporateBilling() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showDownloadDone, setShowDownloadDone] = useState(false);
  const [downloadedMonth, setDownloadedMonth] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  useEffect(() => {
    axios.get('/api/corporate/billing')
      .then(r => { setInvoices(r.data?.invoices?.length ? r.data.invoices : MOCK_INVOICES); setPlan(r.data?.plan ?? { name: 'Professional', price: 5999, employees: 100, current: true, features: [] }); })
      .catch(() => { setInvoices(MOCK_INVOICES); setPlan({ name: 'Professional', price: 5999, employees: 100, current: true, features: [] }); })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (inv: Invoice) => {
    const content = ['═══════════════════════════════', '      CAREBRIDGE INVOICE', '═══════════════════════════════', `Period:     ${inv.month}`, `Invoice ID: ${inv._id}`, `Employees:  ${inv.employees}`, `Bookings:   ${inv.bookings}`, `Amount:     ₹${inv.amount.toLocaleString()}`, `Status:     ${inv.status.toUpperCase()}`, '═══════════════════════════════', 'CareBridge Healthcare Platform', 'support@carebridge.in'].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `carebridge-invoice-${inv.month.replace(' ', '-')}.txt`; a.click();
    URL.revokeObjectURL(url);
    setDownloadedMonth(inv.month); setShowDownloadDone(true);
    setTimeout(() => setShowDownloadDone(false), 4000);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    setUpgrading(true);
    await new Promise(r => setTimeout(r, 1500));
    setUpgrading(false); setUpgraded(true);
    setTimeout(() => { setUpgraded(false); setShowUpgrade(false); setSelectedPlan(''); }, 2000);
  };

  const currentPlanName = plan?.name ?? 'Professional';

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <TopBar title="Billing & Subscription" subtitle="Monthly usage and invoice history" />
          <div className="p-4 md:p-6 space-y-6">

            {/* Current Plan */}
            {plan && (
              <div className="bg-gradient-to-br from-violet-500/20 to-violet-700/10 border border-violet-500/30 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-violet-400 text-sm font-medium mb-1">Current Plan</div>
                    <div className="text-white text-2xl font-bold">{plan.name}</div>
                    <div className="text-gray-400 text-sm mt-1">Up to {plan.employees >= 99999 ? 'Unlimited' : plan.employees} employees</div>
                    <ul className="mt-3 space-y-1">
                      {(plan.features?.length > 0 ? plan.features : ALL_PLANS.find(p => p.name === plan.name)?.features ?? []).map(f => (
                        <li key={f} className="text-gray-300 text-sm flex items-center gap-2"><span className="text-violet-400">✓</span> {f}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-white text-3xl font-bold">₹{plan.price.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">per month</div>
                    <button onClick={() => setShowUpgrade(true)} className="mt-4 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition">
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice History */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800"><h3 className="text-white font-semibold">Invoice History</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead><tr className="border-b border-gray-800">{['Period','Employees','Bookings','Amount','Status','Actions'].map(h=><th key={h} className="text-left px-5 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={6} className="text-center py-10 text-gray-500">Loading...</td></tr>
                    : invoices.map(inv => (
                      <tr key={inv._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                        <td className="px-5 py-3.5 text-white font-medium whitespace-nowrap">{inv.month}</td>
                        <td className="px-5 py-3.5 text-gray-400">{inv.employees}</td>
                        <td className="px-5 py-3.5 text-gray-400">{inv.bookings}</td>
                        <td className="px-5 py-3.5 text-white font-medium">₹{inv.amount.toLocaleString()}</td>
                        <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[inv.status]}`}>{inv.status}</span></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <button onClick={() => setViewInvoice(inv)} className="text-violet-400 hover:text-violet-300 text-xs font-medium transition">View</button>
                            <button onClick={() => handleDownload(inv)} className="text-blue-400 hover:text-blue-300 text-xs font-medium transition">Download</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Download Success Toast */}
      {showDownloadDone && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50">
          <span className="text-2xl">✅</span>
          <div><div className="font-semibold text-sm">Download Complete!</div><div className="text-xs text-emerald-100">{downloadedMonth} invoice saved to your device</div></div>
          <button onClick={() => setShowDownloadDone(false)} className="ml-2 text-emerald-200 hover:text-white">×</button>
        </div>
      )}

      {/* View Invoice Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setViewInvoice(null)}>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Invoice — {viewInvoice.month}</h2>
              <button onClick={() => setViewInvoice(null)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            <div className="bg-gray-950 rounded-xl p-5 font-mono text-sm space-y-2.5">
              <div className="text-violet-400 font-bold text-center text-base mb-3">CAREBRIDGE INVOICE</div>
              {[['Period', viewInvoice.month], ['Invoice ID', viewInvoice._id], ['Employees', viewInvoice.employees.toString()], ['Bookings', viewInvoice.bookings.toString()], ['Amount', `₹${viewInvoice.amount.toLocaleString()}`], ['Status', viewInvoice.status.toUpperCase()]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="text-white font-medium">{v}</span></div>
              ))}
              <div className="border-t border-gray-800 mt-3 pt-3 text-gray-600 text-xs text-center">CareBridge Healthcare Platform · support@carebridge.in</div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setViewInvoice(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition">Close</button>
              <button onClick={() => { handleDownload(viewInvoice); setViewInvoice(null); }} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition">Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plans Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-3xl my-4">
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-white font-bold text-xl">Upgrade Your Plan</h2><p className="text-gray-400 text-sm mt-1">Choose a plan that fits your team size</p></div>
              <button onClick={() => { setShowUpgrade(false); setSelectedPlan(''); }} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ALL_PLANS.map(p => {
                const isCurrent = p.name === currentPlanName;
                const isSelected = selectedPlan === p.name;
                return (
                  <div key={p.name} onClick={() => !isCurrent && setSelectedPlan(p.name)}
                    className={`relative border-2 rounded-2xl p-5 transition ${isCurrent ? 'border-gray-700 opacity-50 cursor-not-allowed' : isSelected ? 'border-violet-500 bg-violet-500/10 cursor-pointer' : `${p.color} hover:bg-gray-800/50 cursor-pointer`}`}>
                    {p.badge && <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold bg-violet-600 text-white">{p.badge}</span>}
                    {isCurrent && <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-700 text-gray-400">Current</span>}
                    {isSelected && !isCurrent && <span className="absolute top-3 right-3 text-violet-400 text-lg">✓</span>}
                    <div className="text-white font-bold text-lg">{p.name}</div>
                    <div className="text-2xl font-bold text-white mt-1">₹{p.price.toLocaleString()}<span className="text-gray-400 text-sm font-normal">/mo</span></div>
                    <div className="text-gray-400 text-sm mt-1">Up to {p.employees >= 99999 ? 'Unlimited' : p.employees} employees</div>
                    <ul className="mt-3 space-y-1.5">
                      {p.features.map(f => <li key={f} className="text-gray-300 text-sm flex items-center gap-2"><span className="text-emerald-400 text-xs">✓</span>{f}</li>)}
                    </ul>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowUpgrade(false); setSelectedPlan(''); }} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition">Cancel</button>
              <button onClick={handleUpgrade} disabled={!selectedPlan || upgrading || upgraded}
                className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed">
                {upgraded ? '✅ Plan Upgraded!' : upgrading ? 'Processing...' : selectedPlan ? `Upgrade to ${selectedPlan}` : 'Select a Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
