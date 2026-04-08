'use client'
import { useRouter, usePathname } from 'next/navigation'
import { clearAuth, getHospital } from '@/lib/auth'

const NAV = [
  { label: 'Dashboard',  href: '/dashboard',  icon: 'D' },
  { label: 'Bookings',   href: '/bookings',   icon: 'B' },
  { label: 'Post an Ad', href: '/ads',         icon: 'A' },
  { label: 'Analytics',  href: '/analytics',  icon: 'N' },
  { label: 'Profile',    href: '/profile',    icon: 'P' },
]

export default function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const hospital = getHospital()

  const initials = hospital?.name
    ? hospital.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'H'

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  return (
    <aside style={{
      width: 220, background: '#0F172A', display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px' }}>
          CareBridge
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Hospital Portal
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <div key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                marginBottom: 2, transition: 'all 0.15s',
                background: active ? 'rgba(13,148,136,0.2)' : 'transparent',
                color: active ? '#4ECDC4' : 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: active ? 700 : 500,
              }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: active ? '#0D9488' : 'rgba(255,255,255,0.3)',
                flexShrink: 0,
              }} />
              {item.label}
            </div>
          )
        })}
      </nav>

      {/* Hospital info + logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 4 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#0D9488,#065f52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {hospital?.name || 'Hospital'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              {hospital?.city || 'Partner'}
            </div>
          </div>
        </div>
        <div onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 500 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(220,38,38,0.5)', flexShrink: 0 }} />
          Sign Out
        </div>
      </div>
    </aside>
  )
}