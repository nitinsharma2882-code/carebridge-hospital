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

export default function CorporateBilling() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/corporate/billing')
      .then(r => {
        setInvoices(r.data?.invoices ?? []);
        setPlan(r.data?.plan ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    paid: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    overdue: 'bg-red-500/20 text-red-400',
  };

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <TopBar title="Billing & Subscription" subtitle="Monthly usage and invoice history" />
          <div className="p-6 space-y-6">

            {/* Current Plan */}
            {plan && (
              <div className="bg-gradient-to-br from-violet-500/20 to-violet-700/10 border border-violet-500/30 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-violet-400 text-sm font-medium mb-1">Current Plan</div>
                    <div className="text-white text-2xl font-bold">{plan.name}</div>
                    <div className="text-gray-400 text-sm mt-1">Up to {plan.employees} employees</div>
                    <ul className="mt-3 space-y-1">
                      {plan.features.map(f => (
                        <li key={f} className="text-gray-300 text-sm flex items-center gap-2">
                          <span className="text-violet-400">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-3xl font-bold">₹{plan.price.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">per month</div>
                    <button className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition">
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice History */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="text-white font-semibold">Invoice History</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Period', 'Employees', 'Bookings', 'Amount', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-500">Loading...</td></tr>
                  ) : invoices.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-500">No invoices yet</td></tr>
                  ) : invoices.map(inv => (
                    <tr key={inv._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="px-5 py-3.5 text-white font-medium">{inv.month}</td>
                      <td className="px-5 py-3.5 text-gray-400">{inv.employees}</td>
                      <td className="px-5 py-3.5 text-gray-400">{inv.bookings}</td>
                      <td className="px-5 py-3.5 text-white font-medium">₹{inv.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[inv.status] ?? 'bg-gray-700 text-gray-400'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button className="text-violet-400 hover:text-violet-300 text-xs transition">
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
