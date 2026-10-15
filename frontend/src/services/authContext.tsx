import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('hms_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Failed to parse cached user', e);
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('hms_access_token');
    } catch (e) {
      console.error('Failed to parse cached token', e);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('hms_access_token');
      const storedUser = localStorage.getItem('hms_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to parse cached session', e);
    }
  }, []);

  const login = (data: AuthResponse) => {
    localStorage.setItem('hms_access_token', data.accessToken);
    localStorage.setItem('hms_refresh_token', data.refreshToken);

    const userObj: User = data.user || {
      id: data.userId || 0,
      username: data.username || '',
      email: data.email || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      gender: data.gender || data.user?.gender || '',
      roles: data.roles || [],
      isActive: true,
    };

    localStorage.setItem('hms_user', JSON.stringify(userObj));
    setToken(data.accessToken);
    setUser(userObj);
  };

  const logout = () => {
    localStorage.removeItem('hms_access_token');
    localStorage.removeItem('hms_refresh_token');
    localStorage.removeItem('hms_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user || !user.roles) return false;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    return user.roles.some((r) => requiredRoles.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        hasRole,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
