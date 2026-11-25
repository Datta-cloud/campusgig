import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role?: 'student' | 'admin') => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  full_name: string;
  password: string;
  phone?: string;
  student_type: 'school' | 'college';
  school_class?: string;
  college_name?: string;
  college_branch?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Security: Never auto-restore stale admin sessions from localStorage across browser restarts
      localStorage.removeItem('cg_remembered_admin_user');
      const localUserRaw = localStorage.getItem('user');
      if (localUserRaw) {
        try {
          const parsedLocal = JSON.parse(localUserRaw);
          if (parsedLocal?.role === 'admin') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      const sessionToken = sessionStorage.getItem('token');
      const sessionUser = sessionStorage.getItem('user');
      const localToken = localStorage.getItem('token');
      const localUser = localStorage.getItem('user');

      const storedToken = sessionToken || localToken;
      const storedUser = sessionUser || localUser;

      if (storedToken && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsed);
          // Validate active session against backend so deleted users cannot stay logged in
          const meRes = await api.get('/auth/me');
          if (meRes.data) {
            setUser(meRes.data);
            const targetStorage = meRes.data.role === 'admin' ? sessionStorage : localStorage;
            targetStorage.setItem('user', JSON.stringify(meRes.data));
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, role?: 'student' | 'admin') => {
    const payload: any = {
      username: email,
      password: password,
    };
    if (role) {
      payload.role = role;
    }
    const response = await api.post('/auth/login', payload);

    const { access_token, user: userData } = response.data;
    // Clear both storages first to avoid cross-role residue
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    // Admin sessions stay in sessionStorage only so reopening browser requires fresh login
    const storage = userData?.role === 'admin' ? sessionStorage : localStorage;
    storage.setItem('token', access_token);
    storage.setItem('user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cg_remembered_admin_user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    const token = response.data?.access_token;
    const userData = response.data?.user || (response.data?.id ? response.data : null);
    if (token) {
      localStorage.setItem('token', token);
      setToken(token);
    }
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
