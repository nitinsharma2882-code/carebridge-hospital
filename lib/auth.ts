export const getHospital = () => {
  if (typeof window === 'undefined') return null;
  try {
    const h = localStorage.getItem('cb_hospital');
    return h ? JSON.parse(h) : null;
  } catch { return null; }
};

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cb_hospital_token');
};

export const saveAuth = (token: string, hospital: Record<string, unknown>) => {
  localStorage.setItem('cb_hospital_token', token);
  localStorage.setItem('cb_hospital', JSON.stringify(hospital));
};

export const clearAuth = () => {
  localStorage.removeItem('cb_hospital_token');
  localStorage.removeItem('cb_hospital');
};

export const isLoggedIn = () => !!getToken();