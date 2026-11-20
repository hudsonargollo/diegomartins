'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  CalendarDays,
  Package,
  Users,
  UserCog,
  Settings,
  LogOut,
  PanelLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/pos', label: 'PDV', icon: ShoppingCart, roles: ['owner', 'manager', 'cashier', 'stylist'] },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays, roles: ['owner', 'manager', 'cashier', 'stylist'] },
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard, roles: ['owner', 'manager', 'cashier', 'stylist'] },
  { href: '/orders', label: 'Pedidos', icon: ClipboardList, roles: ['owner', 'manager', 'cashier', 'stylist'] },
  { href: '/products', label: 'Serviços', icon: Package, roles: ['owner', 'manager'] },
  { href: '/customers', label: 'Clientes', icon: Users, roles: ['owner', 'manager', 'cashier', 'stylist'] },
  { href: '/staff', label: 'Equipe', icon: UserCog, roles: ['owner', 'manager'] },
  { href: '/settings', label: 'Configurações', icon: Settings, roles: ['owner', 'manager'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar_collapsed');
    if (stored === 'true') setCollapsed(true);
    else if (window.innerWidth < 768) setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar_collapsed', String(!prev));
      return !prev;
    });
  };

  // Open/close is independent of collapse: open = expanded (wide), closed = compact.
  const toggleOpen = () => setOpen((prev) => !prev);

  const role = user?.role || 'cashier';
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 border-r border-[var(--sidebar-border)] transition-all duration-200',
        open ? 'w-64' : 'w-16',
        collapsed && !open && 'w-16'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-3 py-3 border-b border-[var(--sidebar-border)]',
          open ? 'items-center gap-3' : 'items-center'
        )}
      >
        {open ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img src="/dm/logo.svg" alt="" className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-display font-medium truncate">{user?.name || tenant?.business_name}</div>
            </div>
          </div>
        ) : (
          <img src="/dm/logo.svg" alt="" className="h-9 w-9" />
        )}
        <button onClick={toggleOpen} className="p-1.5 rounded-md hover:bg-[var(--sidebar-accent)] shrink-0" title={open ? 'Recolher' : 'Expandir'}>
          {open ? <PanelLeft className="h-4 w-4" /> : <PanelLeft className="h-4 w-4 rotate-90" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]'
                  : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-[var(--sidebar-border)]">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}