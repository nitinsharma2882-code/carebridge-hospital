'use client';

// components/AuthGuard.tsx — EXTENDED VERSION
// Drop-in replacement for your existing AuthGuard.
// New prop `requiredRole` restricts access to specific roles.
// If omitted, it behaves exactly like the old AuthGuard (any logged-in user passes).

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn, getRole, getDashboardPath, UserRole } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole; // new optional prop
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/select-role');
      return;
    }

    if (requiredRole && getRole() !== requiredRole) {
      // Logged in but wrong role — redirect to their own dashboard
      router.replace(getDashboardPath());
    }
  }, [router, requiredRole]);

  if (!isLoggedIn()) return null;
  if (requiredRole && getRole() !== requiredRole) return null;

  return <>{children}</>;
}
