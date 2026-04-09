'use client';

// components/Sidebar.tsx — UPDATED (role-aware, backward compatible)
// Replaces your existing Sidebar.tsx.
// Hospital users see exactly the same nav as before.
// Other roles see their own nav from navConfig.ts.

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getHospital, clearAuth, getRole } from '@/lib/auth';
import { navByRole, roleMeta } from '@/lib/navConfig';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = getRole();
  const hospital = getHospital();
  const nav = navByRole[role];
  const meta = roleMeta[role];

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
            {(hospital?.name as string)?.[0] ?? 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">
              {(hospital?.name as string) ?? 'User'}
            </div>
            <div className="text-gray-400 text-xs truncate">
              {(hospital?.email as string) ?? ''}
            </div>
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
