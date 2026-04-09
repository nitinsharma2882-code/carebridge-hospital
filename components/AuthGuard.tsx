'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('cb_hospital_token');

    if (!token) {
      router.replace('/select-role');
      return;
    }

    if (requiredRole) {
      const role = (localStorage.getItem('cb_selected_role') as UserRole) ?? 'hospital';
      if (role !== requiredRole) {
        const redirectMap: Record<string, string> = {
          hospital:       '/dashboard',
          corporate:      '/corporate/dashboard',
          clinic:         '/clinic/dashboard',
          pharmaceutical: '/pharmaceutical/dashboard',
        };
        router.replace(redirectMap[role] ?? '/select-role');
        return;
      }
    }

    setReady(true);
  }, [router, requiredRole]);

  if (!ready) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading...</div>
    </div>
  );

  return <>{children}</>;
}