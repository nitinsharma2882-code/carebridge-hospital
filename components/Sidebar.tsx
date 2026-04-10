'use client';

// components/Sidebar.tsx — FIXED (SSR-safe)
// Uses useState + useEffect to read localStorage only on client,
// preventing "Application error" crash after login.

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAuth, UserRole } from '@/lib/auth';
import { navByRole, roleMeta, NavItem } from '@/lib/navConfig';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't read localStorage until client mounts
  const [role,  setRole]  = useState<UserRole>('hospital');
  const [name,  setName]  = useState('User');
  const [email, setEmail] = useState('');
  const [nav,   setNav]   = useState<NavItem[]>([]);
  const [meta,  setMeta]  = useState(roleMeta['hospital']);

  useEffect(() => {
    // Safe to read localStorage here — runs only on client
    const storedRole = (localStorage.getItem('cb_selected_role') as UserRole) ?? 'hospital';
    let userData = { name: 'User', email: '' };
    try {
      const raw = localStorage.getItem('cb_hospital');
      if (raw) userData = JSON.parse(raw);
    } catch {}

    setRole(storedRole);
    setName((userData as Record<string,string>).name ?? 'User');
    setEmail((userData as Record<string,string>).email ?? '');
    setNav(navByRole[storedRole] ?? navByRole['hospital']);
    setMeta(roleMeta[storedRole] ?? roleMeta['hospital']);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/select-role');
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col fixed left-0 top-0 z-50 overflow-y-auto">
      {/* Logo + Role Badge */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-white font-bold text-sm`}>
            C
          </div>
          <span className="text-white font-bold text-lg">CareBridge</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${meta.color} text-white font-medium`}>
          {meta.label} Panel
        </span>
      </div>

      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-semibold">
            {name?.[0] ?? 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{name}</div>
            <div className="text-gray-400 text-xs truncate">{email}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
