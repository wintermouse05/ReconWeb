import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/apiClient';

const AuthContext = createContext();

const TOKEN_STORAGE_KEY = 'reconweb_token';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest('/auth/me', { token });
        setUser(response.user);
      } catch (err) {
        console.error('Failed to restore session', err);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const handleAuthSuccess = (payload) => {
    setToken(payload.token);
    localStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
    setUser(payload.user);
  };

  const login = async (credentials) => {
    setError(null);
    const payload = await apiRequest('/auth/login', { method: 'POST', body: credentials });
    handleAuthSuccess(payload);
    return payload;
  };

  const register = async (data) => {
    setError(null);
    const payload = await apiRequest('/auth/register', { method: 'POST', body: data });
    handleAuthSuccess(payload);
    return payload;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const authorizedRequest = async (path, options = {}) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      return await apiRequest(path, { ...options, token });
    } catch (err) {
      if (err.status === 401) {
        logout();
      }
      throw err;
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
      request: authorizedRequest,
      isAuthenticated: Boolean(user && token),
      setError,
    }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
