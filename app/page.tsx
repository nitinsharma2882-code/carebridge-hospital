'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Root() {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem('cb_hospital_token')
    if (token) {
      const role = localStorage.getItem('cb_selected_role') || 'hospital'
      const redirectMap: Record<string, string> = {
        hospital:       '/dashboard',
        corporate:      '/corporate/dashboard',
        clinic:         '/clinic/dashboard',
        pharmaceutical: '/pharmaceutical/dashboard',
      }
      router.replace(redirectMap[role] ?? '/dashboard')
    } else {
      router.replace('/select-role')
    }
  }, [])
  return null
}