import { useState, useCallback } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(() => ({
    isAuthenticated: !!localStorage.getItem('ps_auth_token'),
    token: localStorage.getItem('ps_auth_token'),
  }));

  const login = useCallback((token: string) => {
    localStorage.setItem('ps_auth_token', token);
    setAuthState({
      isAuthenticated: true,
      token,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ps_auth_token');
    setAuthState({
      isAuthenticated: false,
      token: null,
    });
  }, []);

  return {
    isAuthenticated: authState.isAuthenticated,
    token: authState.token,
    login,
    logout,
  };
}; 