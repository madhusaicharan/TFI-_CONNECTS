import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('tfi_token'));
  const [loading, setLoading] = useState(true);

  // Auto-load user profile from stored token on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // Token expired or invalid
            localStorage.removeItem('tfi_token');
            setToken(null);
          }
        } catch (err) {
          console.error('Auth load error:', err);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  /**
   * Register a new account.
   * Returns { requiresVerification: true, email } — does NOT log the user in.
   * Caller should redirect to /verify-email?email=...
   */
  const register = async (name, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    // Server returns { needsVerification: true, email }
    return {
      requiresVerification: true,
      email: data.email || email
    };
  };

  /**
   * Log in with email + password.
   * Throws if credentials are wrong OR account is unverified.
   * On unverified: error has .needsVerification = true and .email
   */
  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      const err = new Error(data.message || 'Login failed');
      err.needsVerification = data.needsVerification || false;
      err.email = data.email || email;
      throw err;
    }

    localStorage.setItem('tfi_token', data.token);
    setToken(data.token);
    setUser({ _id: data._id, name: data.name, email: data.email, avatar: data.avatar, isVerified: data.isVerified });
    return data;
  };

  /**
   * Verify email with the 6-digit OTP sent during registration.
   * On success: stores token + sets user (account now active).
   */
  const verifyOtp = async (email, otp) => {
    const res = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'OTP verification failed');

    // Server returns JWT on successful verification
    localStorage.setItem('tfi_token', data.token);
    setToken(data.token);
    setUser({ _id: data._id, name: data.name, email: data.email, avatar: data.avatar, isVerified: true });
    return data;
  };

  /**
   * Request a new verification OTP be sent to the given email.
   */
  const resendOtp = async (email) => {
    const res = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not resend OTP');
    return data;
  };

  /**
   * Resend a password-reset OTP (for use in the verify page in reset mode).
   */
  const resendResetOtp = async (email) => {
    const res = await fetch(`${API_URL}/auth/resend-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not resend reset OTP');
    return data;
  };

  /**
   * Send a password-reset OTP to the given email.
   */
  const forgotPassword = async (email) => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not send reset email');
    return data;
  };

  /**
   * Complete the password reset: verify OTP + set new password.
   */
  const resetPassword = async (email, otp, newPassword) => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Password reset failed');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('tfi_token');
    localStorage.removeItem('tfi_favorites');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, logout,
      verifyOtp, resendOtp, resendResetOtp,
      forgotPassword, resetPassword,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
