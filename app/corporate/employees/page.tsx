'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState, useRef } from 'react';
import axios from '@/lib/api';

interface Employee {
  _id: string;
  name: string;
  email: string;
  corporateEmail: string;
  phone: string;
  department: string;
  employeeCode: string;
  familyMembers: number;
  status: 'active' | 'inactive';
  zeroPay: boolean;
}

export default function CorporateEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [showDetail, setShowDetail] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', employeeCode: '' });
  const [saving, setSaving] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{ added: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axios.get('/api/corporate/employees')
      .then(r => setEmployees(r.data?.employees ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.corporateEmail?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      const r = await axios.post('/api/corporate/employees', form);
      setEmployees(prev => [r.data, ...prev]);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', department: '', employeeCode: '' });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to add employee');
    } finally { setSaving(false); }
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
      return { name: obj.name || obj.fullname || '', email: obj.email || '', phone: obj.phone || obj.mobile || '', department: obj.department || obj.dept || '', employeeCode: obj.employeecode || obj.code || '' };
    }).filter(e => e.name && e.email);
  };

  const handleCSVUpload = async () => {
    if (!csvFile) return;
    setCsvUploading(true); setCsvResult(null);
    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { setCsvResult({ added: 0, errors: ['No valid employees found.'] }); setCsvUploading(false); return; }
      let added = 0; const errors: string[] = [];
      for (const row of rows) {
        try { const r = await axios.post('/api/corporate/employees', row); setEmployees(prev => [r.data, ...prev]); added++; }
        catch (err: any) { errors.push(`${row.email}: ${err?.response?.data?.message ?? 'Failed'}`); }
      }
      setCsvResult({ added, errors });
    } catch { setCsvResult({ added: 0, errors: ['Failed to read file.'] }); }
    finally { setCsvUploading(false); }
  };

  const downloadSample = () => {
    const blob = new Blob(['Name,Email,Phone,Department,EmployeeCode\nRamesh Kumar,ramesh@company.com,9000000001,Engineering,EMP001\nPriya Sharma,priya@company.com,9000000002,Marketing,EMP002'], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sample-employees.csv'; a.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <TopBar title="Employee Management" subtitle="Manage employees — each gets a CareBridge corporate email for zero-payment access"
            actions={
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setShowCSV(true)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition">📂 Upload CSV</button>
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition">+ Add Employee</button>
              </div>
            }
          />

          <div className="p-4 md:p-6 space-y-4">
            {/* Zero-pay info banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <div className="text-emerald-400 font-medium text-sm">Zero-Payment Access Enabled</div>
                <div className="text-gray-400 text-xs mt-0.5">Each employee gets a unique <span className="text-emerald-400 font-mono">@yourcompany.carebridge.com</span> email. When they book services using this email, payment is billed to your corporate account.</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total',       value: employees.length,                                          color: 'text-white' },
                { label: 'Active',      value: employees.filter(e=>e.status==='active').length,           color: 'text-emerald-400' },
                { label: 'Zero-Pay',    value: employees.filter(e=>e.zeroPay).length,                    color: 'text-violet-400' },
                { label: 'Departments', value: new Set(employees.map(e=>e.department).filter(Boolean)).size, color: 'text-blue-400' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-gray-400 text-xs mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, corporate email, or department..."
              className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"/>

            {/* Table */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Name', 'Personal Email', 'CareBridge Email', 'Department', 'Status', 'Zero-Pay', 'Action'].map(h=>(
                        <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading...</td></tr>
                    : filtered.length===0 ? <tr><td colSpan={7} className="text-center py-10 text-gray-500">No employees found. Add one or upload CSV.</td></tr>
                    : filtered.map(emp=>(
                      <tr key={emp._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                        <td className="px-4 py-3.5 text-white font-medium whitespace-nowrap">{emp.name}</td>
                        <td className="px-4 py-3.5 text-gray-400 text-xs">{emp.email}</td>
                        <td className="px-4 py-3.5">
                          {emp.corporateEmail ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-400 font-mono text-xs">{emp.corporateEmail}</span>
                              <button onClick={()=>copyToClipboard(emp.corporateEmail)} className="text-gray-600 hover:text-gray-400 text-xs" title="Copy">📋</button>
                            </div>
                          ) : <span className="text-gray-600 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-gray-300 whitespace-nowrap">{emp.department||'—'}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.status==='active'?'bg-emerald-500/20 text-emerald-400':'bg-gray-700 text-gray-400'}`}>{emp.status}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.zeroPay?'bg-violet-500/20 text-violet-400':'bg-gray-700 text-gray-400'}`}>
                            {emp.zeroPay ? '✓ Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button onClick={()=>setShowDetail(emp)} className="text-violet-400 hover:text-violet-300 text-xs transition">Details</button>
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

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-1">Add Employee</h2>
            <p className="text-gray-400 text-sm mb-4">A CareBridge corporate email will be auto-generated for zero-payment access.</p>
            <div className="space-y-3">
              {[
                { key:'name', placeholder:'Full Name *' },
                { key:'email', placeholder:'Personal Email *' },
                { key:'phone', placeholder:'Phone Number' },
                { key:'department', placeholder:'Department' },
                { key:'employeeCode', placeholder:'Employee Code / ID' },
              ].map(f=>(
                <input key={f.key} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"/>
              ))}
            </div>
            <div className="mt-3 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2.5 text-xs text-violet-300">
              ✨ A unique <strong>@yourcompany.carebridge.com</strong> email will be automatically generated and shown in the employee details.
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>{setShowModal(false);setForm({name:'',email:'',phone:'',department:'',employeeCode:''});}} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50">{saving?'Adding...':'Add Employee'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={()=>setShowDetail(null)}>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Employee Details</h2>
              <button onClick={()=>setShowDetail(null)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Name',             value: showDetail.name },
                { label: 'Personal Email',   value: showDetail.email },
                { label: 'Department',       value: showDetail.department || '—' },
                { label: 'Phone',            value: showDetail.phone || '—' },
                { label: 'Employee Code',    value: showDetail.employeeCode || '—' },
                { label: 'Status',           value: showDetail.status },
              ].map(row=>(
                <div key={row.label} className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-400 text-sm">{row.label}</span>
                  <span className="text-white text-sm font-medium capitalize">{row.value}</span>
                </div>
              ))}
              {/* Corporate Email - highlighted */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mt-2">
                <div className="text-emerald-400 text-xs font-medium mb-1">CareBridge Corporate Email</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white font-mono text-sm break-all">{showDetail.corporateEmail || 'Generating...'}</span>
                  {showDetail.corporateEmail && (
                    <button onClick={()=>copyToClipboard(showDetail.corporateEmail)} className="text-emerald-400 hover:text-emerald-300 text-xs flex-shrink-0 transition">📋 Copy</button>
                  )}
                </div>
                <div className="text-gray-400 text-xs mt-2">Employee uses this email to book services with zero payment. All costs are billed to your corporate account.</div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400 text-sm">Zero-Payment Access</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${showDetail.zeroPay?'bg-violet-500/20 text-violet-400':'bg-gray-700 text-gray-400'}`}>
                  {showDetail.zeroPay ? '✓ Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <button onClick={()=>setShowDetail(null)} className="w-full mt-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition">Close</button>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSV && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Upload Employees via CSV</h2>
              <button onClick={()=>{setShowCSV(false);setCsvFile(null);setCsvResult(null);}} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 mb-4 text-sm text-gray-300 space-y-1">
              <div className="font-medium text-white mb-2">CSV Format:</div>
              <div>• Required: <span className="text-violet-400 font-medium">Name, Email</span></div>
              <div>• Optional: Phone, Department, EmployeeCode</div>
              <div>• Corporate emails auto-generated for each employee</div>
              <button onClick={downloadSample} className="mt-2 text-violet-400 hover:text-violet-300 text-xs underline">⬇ Download sample CSV</button>
            </div>
            <div onClick={()=>fileInputRef.current?.click()} onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f?.name.endsWith('.csv'))setCsvFile(f);}}
              className="border-2 border-dashed border-gray-700 hover:border-violet-500 rounded-xl p-8 text-center cursor-pointer transition mb-4">
              <div className="text-4xl mb-2">📂</div>
              {csvFile ? (
                <div><div className="text-white font-medium">{csvFile.name}</div><div className="text-gray-400 text-sm mt-1">{(csvFile.size/1024).toFixed(1)} KB</div><button onClick={e=>{e.stopPropagation();setCsvFile(null);setCsvResult(null);}} className="text-red-400 text-xs mt-2 hover:text-red-300">Remove</button></div>
              ) : (
                <div><div className="text-white font-medium">Click to browse or drag & drop</div><div className="text-gray-400 text-sm mt-1">CSV files only</div></div>
              )}
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e=>setCsvFile(e.target.files?.[0]??null)}/>
            </div>
            {csvResult && (
              <div className={`rounded-xl p-4 mb-4 text-sm ${csvResult.added>0?'bg-emerald-500/10 border border-emerald-500/30':'bg-red-500/10 border border-red-500/30'}`}>
                {csvResult.added>0&&<div className="text-emerald-400 font-medium">✅ {csvResult.added} employee{csvResult.added>1?'s':''} added with corporate emails!</div>}
                {csvResult.errors.length>0&&<div className="mt-2"><div className="text-red-400 font-medium">⚠ {csvResult.errors.length} error(s):</div><ul className="mt-1">{csvResult.errors.slice(0,5).map((e,i)=><li key={i} className="text-red-300 text-xs">{e}</li>)}</ul></div>}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={()=>{setShowCSV(false);setCsvFile(null);setCsvResult(null);}} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition">Close</button>
              <button onClick={handleCSVUpload} disabled={!csvFile||csvUploading} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50">{csvUploading?'Importing...':'Upload & Import'}</button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
