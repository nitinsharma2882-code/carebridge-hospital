'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState, useRef } from 'react';
import axios from '@/lib/api';

interface Employee { _id: string; name: string; email: string; phone: string; department: string; familyMembers: number; status: 'active' | 'inactive'; }

export default function CorporateEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '' });
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
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      const r = await axios.post('/api/corporate/employees', form);
      setEmployees(prev => [r.data, ...prev]);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', department: '' });
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
      return {
        name: obj.name || obj.fullname || '',
        email: obj.email || obj.emailaddress || '',
        phone: obj.phone || obj.mobile || '',
        department: obj.department || obj.dept || '',
      };
    }).filter(e => e.name && e.email);
  };

  const handleCSVUpload = async () => {
    if (!csvFile) return;
    setCsvUploading(true); setCsvResult(null);
    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { setCsvResult({ added: 0, errors: ['No valid employees found. Make sure CSV has Name and Email columns.'] }); setCsvUploading(false); return; }
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
    const blob = new Blob(['Name,Email,Phone,Department\nRamesh Kumar,ramesh@company.com,9000000001,Engineering\nPriya Sharma,priya@company.com,9000000002,Marketing'], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sample-employees.csv'; a.click();
  };

  return (
    <AuthGuard requiredRole="corporate">
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex flex-col ml-64 min-w-0">
          <TopBar title="Employee Management" subtitle="Manage employees and their family members"
            actions={
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setShowCSV(true)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition">📂 Upload CSV</button>
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition">+ Add Employee</button>
              </div>
            }
          />
          <div className="p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{label:'Total',value:employees.length,color:'text-white'},{label:'Active',value:employees.filter(e=>e.status==='active').length,color:'text-emerald-400'},{label:'Inactive',value:employees.filter(e=>e.status==='inactive').length,color:'text-red-400'},{label:'Departments',value:new Set(employees.map(e=>e.department).filter(Boolean)).size,color:'text-violet-400'}].map(s=>(
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-gray-400 text-xs mb-1">{s.label}</div><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div></div>
              ))}
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, or department..."
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"/>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead><tr className="border-b border-gray-800">{['Name','Email','Department','Phone','Family','Status'].map(h=><th key={h} className="text-left px-5 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={6} className="text-center py-10 text-gray-500">Loading...</td></tr>
                    : filtered.length===0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-500">No employees found. Add one or upload a CSV file.</td></tr>
                    : filtered.map(emp=>(
                      <tr key={emp._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                        <td className="px-5 py-3.5 text-white font-medium whitespace-nowrap">{emp.name}</td>
                        <td className="px-5 py-3.5 text-gray-400">{emp.email}</td>
                        <td className="px-5 py-3.5 text-gray-300">{emp.department||'—'}</td>
                        <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{emp.phone||'—'}</td>
                        <td className="px-5 py-3.5 text-gray-400">{emp.familyMembers??0}</td>
                        <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.status==='active'?'bg-emerald-500/20 text-emerald-400':'bg-gray-700 text-gray-400'}`}>{emp.status}</span></td>
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
            <h2 className="text-white font-semibold text-lg mb-4">Add Employee</h2>
            <div className="space-y-3">
              {(['name','email','phone','department'] as const).map(field=>(
                <input key={field} placeholder={field.charAt(0).toUpperCase()+field.slice(1)} value={form[field]} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"/>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>{setShowModal(false);setForm({name:'',email:'',phone:'',department:''}); }} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50">{saving?'Saving...':'Add Employee'}</button>
            </div>
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
              <div>• Required columns: <span className="text-violet-400 font-medium">Name, Email</span></div>
              <div>• Optional columns: Phone, Department</div>
              <div>• First row must be headers</div>
              <button onClick={downloadSample} className="mt-2 text-violet-400 hover:text-violet-300 text-xs underline">⬇ Download sample CSV template</button>
            </div>
            <div onClick={()=>fileInputRef.current?.click()} onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f?.name.endsWith('.csv'))setCsvFile(f);}}
              className="border-2 border-dashed border-gray-700 hover:border-violet-500 rounded-xl p-8 text-center cursor-pointer transition mb-4">
              <div className="text-4xl mb-2">📂</div>
              {csvFile ? (
                <div>
                  <div className="text-white font-medium">{csvFile.name}</div>
                  <div className="text-gray-400 text-sm mt-1">{(csvFile.size/1024).toFixed(1)} KB · {parseCSV('').length} rows detected</div>
                  <button onClick={e=>{e.stopPropagation();setCsvFile(null);setCsvResult(null);}} className="text-red-400 text-xs mt-2 hover:text-red-300">Remove file</button>
                </div>
              ) : (
                <div><div className="text-white font-medium">Click to browse or drag & drop</div><div className="text-gray-400 text-sm mt-1">CSV files only (.csv)</div></div>
              )}
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e=>setCsvFile(e.target.files?.[0]??null)}/>
            </div>
            {csvResult && (
              <div className={`rounded-xl p-4 mb-4 text-sm ${csvResult.added>0?'bg-emerald-500/10 border border-emerald-500/30':'bg-red-500/10 border border-red-500/30'}`}>
                {csvResult.added>0&&<div className="text-emerald-400 font-medium">✅ {csvResult.added} employee{csvResult.added>1?'s':''} added successfully!</div>}
                {csvResult.errors.length>0&&<div className="mt-2"><div className="text-red-400 font-medium">⚠ {csvResult.errors.length} error{csvResult.errors.length>1?'s':''}:</div><ul className="mt-1 space-y-0.5">{csvResult.errors.slice(0,5).map((e,i)=><li key={i} className="text-red-300 text-xs">{e}</li>)}</ul></div>}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={()=>{setShowCSV(false);setCsvFile(null);setCsvResult(null);}} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition">Close</button>
              <button onClick={handleCSVUpload} disabled={!csvFile||csvUploading} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50">
                {csvUploading?'Importing...':'Upload & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
