'use client';
import ProfilePage from '@/components/ProfilePage';
export default function Page() {
  return <ProfilePage role="corporate" apiBase="/api/corporate" extraFields={[
    { key: 'gstin', label: 'GSTIN', placeholder: '22AAAAA0000A1Z5' },
    { key: 'industry', label: 'Industry', placeholder: 'Technology / Healthcare / Finance' },
  ]} />;
}
