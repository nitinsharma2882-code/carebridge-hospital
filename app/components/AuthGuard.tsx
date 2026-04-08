'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
    } else {
      setReady(true)
    }
  }, [])

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8FAFC' }}>
      <div style={{ fontSize: 14, color: '#64748B' }}>Loading...</div>
    </div>
  )

  return <>{children}</>
}