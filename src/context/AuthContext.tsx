import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'ADMIN' | 'SENIOR_TL' | 'TEAM_LEADER' | 'ASSOCIATE';

interface User {
  id: string;
  userCode: string;
  role: UserRole;
  fullName: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const storedToken = localStorage.getItem('khu_auth_token');
    const storedUser = localStorage.getItem('khu_auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user');
      }
    }
    setIsInitialized(true);
  }, []);

  // Heartbeat interval
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        await fetch('/api/auth/heartbeat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (e) {
        // Silently fail for heartbeat
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('khu_auth_token', newToken);
    localStorage.setItem('khu_auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('khu_auth_token');
    localStorage.removeItem('khu_auth_user');
  };

  if (!isInitialized) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
