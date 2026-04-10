'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';
import axios from '@/lib/api';

interface Order {
  _id: string;
  leadName: string;
  product: string;
  quantity: number;
  status: 'new' | 'confirmed' | 'delivered' | 'cancelled';
  date: string;
  value: number;
  phone?: string;
  location?: string;
}

// Demo data shown when API returns empty
const DEMO_ORDERS: Order[] = [
  { _id: 'o1', leadName: 'Dr. Ramesh Sharma',  product: 'Paracetamol 500mg', quantity: 200, status: 'confirmed', date: new Date().toISOString(),                     value: 4500,  phone: '9000000001', location: 'Delhi' },
  { _id: 'o2', leadName: 'City Medical Store',  product: 'Amoxicillin 250mg', quantity: 100, status: 'new',       date: new Date(Date.now()-86400000).toISOString(),   value: 3200,  phone: '9000000002', location: 'Mumbai' },
  { _id: 'o3', leadName: 'Dr. Priya Mehta',     product: 'Ibuprofen 400mg',   quantity: 150, status: 'delivered', date: new Date(Date.now()-172800000).toISOString(), value: 2800,  phone: '9000000003', location: 'Bangalore' },
  { _id: 'o4', leadName: 'Health Plus Clinic',  product: 'Azithromycin 500mg',quantity: 50,  status: 'cancelled', date: new Date(Date.now()-259200000).toISOString(), value: 6000,  phone: '9000000004', location: 'Hyderabad' },
  { _id: 'o5', leadName: 'Dr. Suresh Kumar',    product: 'Metformin 500mg',   quantity: 300, status: 'delivered', date: new Date(Date.now()-345600000).toISOString(), value: 5400,  phone: '9000000005', location: 'Chennai' },
];

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  new:       { label: 'New Lead',   bg: '#DBEAFE', color: '#1E40AF' },
  confirmed: { label: 'Confirmed',  bg: '#FEF3C7', color: '#92400E' },
  delivered: { label: 'Delivered',  bg: '#DCFCE7', color: '#14532D' },
  cancelled: { label: 'Cancelled',  bg: '#FEE2E2', color: '#7F1D1D' },
};

function downloadCSV(orders: Order[]) {
  const headers = ['Lead/Customer', 'Product', 'Quantity', 'Value', 'Status', 'Location', 'Date'];
  const rows = orders.map(o => [
    o.leadName, o.product, o.quantity,
    `Rs. ${o.value}`, STATUS_CFG[o.status]?.label || o.status,
    o.location || 'N/A',
    new Date(o.date).toLocaleDateString('en-IN'),
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `carebridge-pharma-orders-${Date.now()}.csv`;
  a.click();
}

export default function PharmaOrdersPage() {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'all' | 'new' | 'confirmed' | 'delivered' | 'cancelled'>('all');
  const [search,  setSearch]  = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    axios.get('/api/pharmaceutical/orders')
      .then(r => {
        const data = r.data?.orders || r.data?.data || [];
        setOrders(data.length > 0 ? data : DEMO_ORDERS);
      })
      .catch(() => setOrders(DEMO_ORDERS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders
    .filter(o => tab === 'all' || o.status === tab)
    .filter(o => {
      if (!search) return true;
      const q = search.toLowerCase();
      return o.leadName.toLowerCase().includes(q) ||
             o.product.toLowerCase().includes(q) ||
             (o.location || '').toLowerCase().includes(q);
    });

  const counts = {
    all:       orders.length,
    new:       orders.filter(o => o.status === 'new').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const totalValue = filtered.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.value, 0);

  const tabs = [
    { key: 'all',       label: 'All'       },
    { key: 'new',       label: 'New Leads' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ] as const;

  return (
    <AuthGuard requiredRole="pharmaceutical">
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar />
        <div style={{ marginLeft: 256, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar
            title="Orders & Leads"
            subtitle="Track product orders and leads generated via CareBridge"
            actions={
              <button onClick={() => downloadCSV(filtered)}
                style={{ padding: '8px 14px', background: '#F97316', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Export CSV
              </button>
            }
          />

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Total Orders',  value: orders.length,                                         color: '#F97316', bg: '#FFF7ED' },
                { label: 'New Leads',     value: orders.filter(o=>o.status==='new').length,              color: '#1d4ed8', bg: '#EFF6FF' },
                { label: 'Delivered',     value: orders.filter(o=>o.status==='delivered').length,        color: '#16A34A', bg: '#F0FDF4' },
                { label: 'Total Value',   value: `Rs.${totalValue.toLocaleString()}`,                   color: '#7C3AED', bg: '#F5F3FF' },
              ].map((c, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* Search + tabs */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0' }}>
                <input
                  placeholder="Search by lead name, product, or location..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', maxWidth: 420, padding: '8px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
                />
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' }}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{ flex: 1, minWidth: 80, padding: '12px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab===t.key ? 700 : 500, color: tab===t.key ? '#F97316' : '#94A3B8', borderBottom: tab===t.key ? '2.5px solid #F97316' : '2.5px solid transparent', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                    {t.label} <span style={{ marginLeft: 4, background: tab===t.key ? '#FFF7ED' : '#F1F5F9', color: tab===t.key ? '#F97316' : '#94A3B8', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>{counts[t.key]}</span>
                  </button>
                ))}
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>Loading orders...</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>No orders found</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        {['Lead/Customer','Product','Qty','Value','Location','Date','Status','Action'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(o => {
                        const cfg = STATUS_CFG[o.status] || STATUS_CFG.new;
                        return (
                          <tr key={o._id} style={{ borderTop: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>{o.leadName}</td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>{o.product}</td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>{o.quantity}</td>
                            <td style={{ padding: '12px 16px', color: '#F97316', fontWeight: 700, whiteSpace: 'nowrap' }}>Rs. {o.value.toLocaleString()}</td>
                            <td style={{ padding: '12px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>{o.location || '—'}</td>
                            <td style={{ padding: '12px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(o.date).toLocaleDateString('en-IN')}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>{cfg.label}</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <button onClick={() => setSelected(o)}
                                style={{ padding: '5px 12px', background: '#FFF7ED', color: '#F97316', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail popup */}
        {selected && (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{selected.leadName}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Order ID: {selected._id.slice(-8).toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: STATUS_CFG[selected.status]?.bg, color: STATUS_CFG[selected.status]?.color, fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 12px' }}>{STATUS_CFG[selected.status]?.label}</span>
                  <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                {[
                  { label: 'Product',   value: selected.product },
                  { label: 'Quantity',  value: selected.quantity.toString() },
                  { label: 'Value',     value: `Rs. ${selected.value.toLocaleString()}` },
                  { label: 'Phone',     value: selected.phone || 'N/A' },
                  { label: 'Location',  value: selected.location || 'N/A' },
                  { label: 'Date',      value: new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{row.value}</span>
                  </div>
                ))}
                <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 20, padding: 12, background: '#F97316', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
