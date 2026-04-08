'use client';
import ProfilePage from '@/components/ProfilePage';
export default function Page() {
  return <ProfilePage role="clinic" apiBase="/api/clinic" extraFields={[
    { key: 'registrationNumber', label: 'Clinic Reg. No.', placeholder: 'MH/12345/2020' },
    { key: 'speciality', label: 'Speciality', placeholder: 'General / Dental / Ortho' },
  ]} />;
}
