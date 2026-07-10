import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('eldercare_user');
    if (!stored || stored === 'undefined' || stored === 'null') return null;
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('eldercare_user');
      localStorage.removeItem('eldercare_token');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('eldercare_token', res.data.token);
    localStorage.setItem('eldercare_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('eldercare_token');
    localStorage.removeItem('eldercare_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}