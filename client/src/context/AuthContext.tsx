'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getCookieOptions = () => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('irctcv2.co.in')) {
      return { domain: '.irctcv2.co.in' };
    }
    return {};
  };

  const fetchUser = async (token: string) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      console.error('Auth check failed:', err);
      // Clean up invalid tokens
      Cookies.remove('token', getCookieOptions());
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (token) {
      await fetchUser(token);
    } else {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically upgrade existing tokens to be cross-domain
    const currentToken = Cookies.get('token') || localStorage.getItem('token');
    if (currentToken && typeof window !== 'undefined') {
      Cookies.set('token', currentToken, getCookieOptions());
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', currentToken);
      }
    }
    refreshUser();
  }, []);

  const login = (token: string) => {
    Cookies.set('token', token, getCookieOptions());
    localStorage.setItem('token', token);
    setLoading(true);
    fetchUser(token);
  };

  const logout = () => {
    Cookies.remove('token');
    if (typeof window !== 'undefined' && window.location.hostname.includes('irctcv2.co.in')) {
      Cookies.remove('token', { domain: '.irctcv2.co.in' });
    }
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
