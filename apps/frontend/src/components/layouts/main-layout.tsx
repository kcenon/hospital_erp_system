'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/auth-store';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setSidebarOpen(true)} />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            'hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:top-16',
            'border-r bg-background',
          )}
        >
          <div className="flex flex-1 flex-col overflow-y-auto pt-2">
            <Sidebar userRole={user?.role} />
          </div>
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-60 p-0 pt-10">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar userRole={user?.role} onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 lg:pl-60">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
