'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Role = 'hospital' | 'corporate' | 'clinic' | 'pharmaceutical';

const roles: {
  id: Role;
  label: string;
  icon: string;
  description: string;
  color: string;
}[] = [
  {
    id: 'hospital',
    label: 'Hospital',
    icon: '🏥',
    description: 'Track patients, manage bookings & post ads',
    color: 'from-blue-500 to-blue-700',
  },
  {
    id: 'corporate',
    label: 'Corporate',
    icon: '🏢',
    description: 'Employee healthcare management & billing',
    color: 'from-violet-500 to-violet-700',
  },
  {
    id: 'clinic',
    label: 'Clinic',
    icon: '🩺',
    description: 'Patient records, bookings & promotions',
    color: 'from-emerald-500 to-emerald-700',
  },
  {
    id: 'pharmaceutical',
    label: 'Pharmaceutical',
    icon: '💊',
    description: 'Product promotions, orders & analytics',
    color: 'from-orange-500 to-orange-700',
  },
];

export default function SelectRolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    if (!selected) return;
    setLoading(true);
    // Save selected role to localStorage — login page reads this
    localStorage.setItem('cb_selected_role', selected);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
              C
            </div>
            <span className="text-white text-2xl font-bold">CareBridge</span>
          </div>
          <h1 className="text-white text-xl font-semibold mt-4">Select Account Type</h1>
          <p className="text-gray-400 text-sm mt-1">Choose your organisation type to continue</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                selected === role.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-600'
              }`}
            >
              {selected === role.id && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                  ✓
                </span>
              )}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-xl mb-3`}>
                {role.icon}
              </div>
              <div className="text-white font-semibold text-sm">{role.label}</div>
              <div className="text-gray-400 text-xs mt-1 leading-snug">{role.description}</div>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
        >
          {loading ? 'Redirecting...' : 'Continue to Login →'}
        </button>

        <p className="text-center text-gray-500 text-xs mt-4">
          Each account type has a separate secure dashboard
        </p>
      </div>
    </div>
  );
}
