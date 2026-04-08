'use client'
import { getHospital } from '@/lib/auth'

interface Props {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function TopBar({ title, subtitle, actions }: Props) {
  const hospital = getHospital()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{
      background: '#fff', padding: '16px 28px',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
          {subtitle || `${greeting}, ${hospital?.name || 'Hospital'}`}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  )
}