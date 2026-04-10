'use client';

// components/AuthGuard.tsx — FIXED
// Prevents "Application error" crash caused by reading localStorage before
// the component mounts on the client (SSR has no localStorage).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn, getRole, getDashboardPath, UserRole } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  // Key fix: don't render anything until we know we're on the client
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Only runs on client — localStorage is safe here
    if (!isLoggedIn()) {
      router.replace('/select-role');
      return;
    }

    if (requiredRole && getRole() !== requiredRole) {
      router.replace(getDashboardPath());
      return;
    }

    // All checks passed — safe to render children
    setReady(true);
  }, [router, requiredRole]);

  // Don't render anything until client-side checks are done
  // This prevents the flash and the SSR crash
  if (!ready) return null;

  return <>{children}</>;
}
