import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CareBridge Hospital Portal',
  description: 'Hospital and Clinic Partner Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}