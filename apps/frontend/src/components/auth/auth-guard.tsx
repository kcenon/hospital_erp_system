'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';

const PUBLIC_PATHS = ['/login'];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (!isAuthenticated && !isPublicPath) {
      router.replace('/login');
    } else if (isAuthenticated && isPublicPath) {
      router.replace('/');
    }

    setIsChecking(false);
  }, [isAuthenticated, pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return <>{children}</>;
}
