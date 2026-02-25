'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { ChangePasswordModal } from './change-password-modal';

const PUBLIC_PATHS = ['/login'];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (!isAuthenticated && !isPublicPath) {
      router.replace('/login');
    } else if (isAuthenticated && isPublicPath) {
      router.replace('/');
    }
  }, [isAuthenticated, isHydrated, pathname, router]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && user?.mustChangePassword) {
      setShowChangePassword(true);
    }
  }, [isHydrated, isAuthenticated, user?.mustChangePassword]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  if (!isAuthenticated && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <>
      {children}
      {showChangePassword && (
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => {
            // Only allow closing if password was changed
          }}
          onSuccess={() => {
            useAuthStore.setState({
              user: user ? { ...user, mustChangePassword: false } : null,
            });
            setShowChangePassword(false);
          }}
        />
      )}
    </>
  );
}
