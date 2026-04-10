// lib/navConfig.ts — Patients & Bookings removed from clinic nav
import { UserRole } from './auth';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const hospitalNav: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',  icon: '📊' },
  { label: 'Bookings',     href: '/bookings',   icon: '📋' },
  { label: 'Analytics',    href: '/analytics',  icon: '📈' },
  { label: 'Post an Ad',   href: '/ads',        icon: '📢' },
  { label: 'Support',      href: '/support',    icon: '🎧' },
  { label: 'Profile',      href: '/profile',    icon: '👤' },
];

const corporateNav: NavItem[] = [
  { label: 'Dashboard',       href: '/corporate/dashboard',       icon: '📊' },
  { label: 'Employees',       href: '/corporate/employees',       icon: '👥' },
  { label: 'Bookings',        href: '/corporate/bookings',        icon: '📋' },
  { label: 'Health Events',   href: '/corporate/events',          icon: '🏕️' },
  { label: 'Communications',  href: '/corporate/communications',  icon: '✉️' },
  { label: 'Billing',         href: '/corporate/billing',         icon: '💳' },
  { label: 'Analytics',       href: '/corporate/analytics',       icon: '📈' },
  { label: 'Notifications',   href: '/corporate/notifications',   icon: '🔔' },
  { label: 'Support',         href: '/corporate/support',         icon: '🎧' },
  { label: 'Profile',         href: '/corporate/profile',         icon: '👤' },
];

// ── Clinic: Patients removed, Bookings kept ──────────────────────────────────
const clinicNav: NavItem[] = [
  { label: 'Dashboard',  href: '/clinic/dashboard',  icon: '📊' },
  { label: 'Bookings',   href: '/clinic/bookings',   icon: '📋' },
  { label: 'Analytics',  href: '/clinic/analytics',  icon: '📈' },
  { label: 'Post an Ad', href: '/clinic/ads',        icon: '📢' },
  { label: 'Support',    href: '/clinic/support',    icon: '🎧' },
  { label: 'Profile',    href: '/clinic/profile',    icon: '👤' },
];

const pharmaNav: NavItem[] = [
  { label: 'Dashboard',    href: '/pharmaceutical/dashboard',   icon: '📊' },
  { label: 'Promotions',   href: '/pharmaceutical/promotions',  icon: '🎯' },
  { label: 'Orders/Leads', href: '/pharmaceutical/orders',      icon: '📦' },
  { label: 'Analytics',    href: '/pharmaceutical/analytics',   icon: '📈' },
  { label: 'Post an Ad',   href: '/pharmaceutical/ads',         icon: '📢' },
  { label: 'Support',      href: '/pharmaceutical/support',     icon: '🎧' },
  { label: 'Profile',      href: '/pharmaceutical/profile',     icon: '👤' },
];

export const navByRole: Record<UserRole, NavItem[]> = {
  hospital:       hospitalNav,
  corporate:      corporateNav,
  clinic:         clinicNav,
  pharmaceutical: pharmaNav,
};

export const roleMeta: Record<UserRole, { label: string; color: string }> = {
  hospital:       { label: 'Hospital',       color: 'from-blue-500 to-blue-700' },
  corporate:      { label: 'Corporate',      color: 'from-violet-500 to-violet-700' },
  clinic:         { label: 'Clinic',         color: 'from-emerald-500 to-emerald-700' },
  pharmaceutical: { label: 'Pharmaceutical', color: 'from-orange-500 to-orange-700' },
};
