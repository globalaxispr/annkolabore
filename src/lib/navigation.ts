import {
  LayoutDashboard,
  Home,
  UserRound,
  ListChecks,
  Receipt,
  Clock,
  Users,
  ScrollText,
  BarChart3,
  History,
  PlusCircle,
  HeartHandshake,
  QrCode,
  type LucideIcon,
} from 'lucide-react';
import type { UserProfile } from './types';

/**
 * Single source of truth for the dashboard navigation. The desktop sidebar,
 * the mobile drawer and the top-header page titles all read from here.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match only the exact pathname (used for index routes). */
  exact?: boolean;
  /** Shows the pending-contributions counter next to the item. */
  showPendingBadge?: boolean;
}

export interface NavSection {
  id: 'public' | 'member' | 'admin';
  title?: string;
  items: NavItem[];
}

export const PUBLIC_NAV: NavItem[] = [
  { href: '/', label: 'Akèy', icon: Home, exact: true },
  { href: '/kontribye', label: 'Kontribiye', icon: HeartHandshake },
];

export const MEMBER_NAV: NavItem[] = [
  { href: '/', label: 'Akèy', icon: Home, exact: true },
  { href: '/chofe', label: 'Kont Mwen', icon: UserRound, exact: true },
  { href: '/chofe/soumet', label: 'Soumèt Kontribisyon', icon: PlusCircle },
  { href: '/kontribye', label: 'Kontribiye (Donasyon)', icon: HeartHandshake },
  { href: '/perfil', label: 'Pwofil Mwen', icon: UserRound },
];

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Apèsi Finansye', icon: LayoutDashboard, exact: true },
  { href: '/admin/atant', label: 'Kontribisyon an Atant', icon: Clock, showPendingBadge: true },
  { href: '/admin/donasyon', label: 'Donasyon Piblik', icon: HeartHandshake },
  { href: '/admin/configuracoes/pix', label: 'Konfigirasyon PIX', icon: QrCode },
  { href: '/admin/manm', label: 'Manm Gwoup la', icon: Users },
  { href: '/admin/rapo', label: 'Rapò Finansye', icon: BarChart3 },
  { href: '/admin/odit', label: 'Istwa Odit', icon: History },
];

export function getNavSections(user: UserProfile | null): NavSection[] {
  if (!user) return [{ id: 'public', items: PUBLIC_NAV }];
  const sections: NavSection[] = [{ id: 'member', title: 'Prensipal', items: MEMBER_NAV }];
  if (user.role === 'admin') {
    sections.push({ id: 'admin', title: 'Administrasyon', items: ADMIN_NAV });
  }
  return sections;
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Pages that exist but are not sidebar entries. */
const EXTRA_TITLES: Record<string, { title: string; parent?: string }> = {
  '/kontribye': { title: 'Kontribiye Kounye a' },
  '/chofe/soumet': { title: 'Soumèt Kontribisyon', parent: 'Kont Mwen' },
  '/auth/login': { title: 'Konekte' },
  '/auth/register': { title: 'Kreye Kont' },
  '/admin/donasyon': { title: 'Donasyon Piblik', parent: 'Administrasyon' },
  '/admin/configuracoes/pix': { title: 'Konfigirasyon PIX', parent: 'Administrasyon' },
};

export function getPageMeta(pathname: string): { title: string; section?: string } {
  if (EXTRA_TITLES[pathname]) {
    const { title, parent } = EXTRA_TITLES[pathname];
    return { title, section: parent };
  }
  const adminItem = ADMIN_NAV.find((i) => isNavItemActive(pathname, i));
  if (adminItem) return { title: adminItem.label, section: 'Administrasyon' };
  const memberItem = MEMBER_NAV.find((i) => isNavItemActive(pathname, i));
  if (memberItem) return { title: memberItem.label };
  return { title: 'Akèy' };
}

export const ALL_NAV_HREFS: string[] = Array.from(
  new Set([...PUBLIC_NAV, ...MEMBER_NAV, ...ADMIN_NAV].map((i) => i.href))
);

