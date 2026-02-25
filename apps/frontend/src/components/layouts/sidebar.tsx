'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  ClipboardList,
  FileText,
  Activity,
  Pill,
  NotebookPen,
  Droplets,
  FileBarChart,
  Settings,
  UserCog,
  Shield,
  ScrollText,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Patients',
    href: '/patients',
    icon: Users,
  },
  {
    label: 'Rooms',
    href: '/rooms',
    icon: BedDouble,
  },
  {
    label: 'Rounding',
    href: '/rounding',
    icon: ClipboardList,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: FileText,
    children: [
      { label: 'Vital Signs', href: '/reports/vital-signs', icon: Activity },
      { label: 'Medications', href: '/reports/medications', icon: Pill },
      { label: 'Nursing Notes', href: '/reports/nursing-notes', icon: NotebookPen },
      { label: 'Intake/Output', href: '/reports/intake-output', icon: Droplets },
      { label: 'Daily Reports', href: '/reports/daily-reports', icon: FileBarChart },
    ],
  },
  {
    label: 'Admin',
    href: '/admin',
    icon: Settings,
    roles: ['admin'],
    children: [
      { label: 'Users', href: '/admin/users', icon: UserCog },
      { label: 'Roles', href: '/admin/roles', icon: Shield },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
    ],
  },
];

interface SidebarProps {
  userRole?: UserRole;
  onNavigate?: () => void;
}

export function Sidebar({ userRole, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole)),
  );

  return (
    <nav className="flex flex-col gap-1 p-3">
      {filteredItems.map((item) => (
        <NavItemComponent key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

function NavItemComponent({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive =
    hasChildren && item.children!.some((child) => pathname.startsWith(child.href));
  const [isOpen, setIsOpen] = useState(isChildActive);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            isActive || isChildActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
          />
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-3">
            {item.children!.map((child) => {
              const childActive = pathname.startsWith(child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors',
                    childActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <child.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}
