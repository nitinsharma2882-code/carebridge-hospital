'use client';
import ProfilePage from '@/components/ProfilePage';
export default function Page() {
  return <ProfilePage role="pharmaceutical" apiBase="/api/pharmaceutical" extraFields={[
    { key: 'licenseNumber', label: 'Drug License No.', placeholder: 'MH-MUM-123456' },
    { key: 'gstin', label: 'GSTIN', placeholder: '22AAAAA0000A1Z5' },
  ]} />;
}
