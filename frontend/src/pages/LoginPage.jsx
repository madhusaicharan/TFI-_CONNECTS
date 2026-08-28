import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Film, Clapperboard, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import './LoginPage.css';

/**
 * LoginPage — handles Login, Signup, Forgot-Password, and OTP Verification inline.
 *
 * Modes:
 *  - 'login'        → Standard login form
 *  - 'signup'       → Registration form
 *  - 'forgot'       → Request password reset OTP
 *  - 'verify'       → Verify account OTP (sign up flow)
 *  - 'reset_verify' → Verify reset OTP + enter new password
 */
const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const queryEmail = searchParams.get('email') || '';
  const queryMode  = searchParams.get('mode') || '';
  const devOtp     = searchParams.get('devOtp') || '';

  // Current view mode
  const [mode, setMode] = useState('login');

  // Input states
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verification states (OTP boxes)
  const [digits, setDigits]             = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown]         = useState(0);
  const [resendMsg, setResendMsg]       = useState('');

  // Password reset (Step 2 inside reset_verify)
  const [showReset, setShowReset]       = useState(false);
  const [newPassword, setNewPassword]   = useState('');
  const [confirmPass, setConfirmPass]   = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Status & Feedback states
  const [error, setError]               = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);

  // Unverified banner state (for sign in attempts with unverified emails)
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading]     = useState(false);

  const inputRefs = useRef([]);

  const {
    login,
    register,
    forgotPassword,
    resendOtp,
    verifyOtp,
    resendResetOtp,
    resetPassword
  } = useAuth();

  // ── Sync URL Params on Mount/Path Change ──────────────────────────────────
  useEffect(() => {
    if (location.pathname === '/verify-email') {
      if (queryMode === 'reset') {
        setMode('reset_verify');
      } else {
        setMode('verify');
      }
      if (queryEmail) {
        setEmail(queryEmail);
      }
    } else {
      // Support ?action=forgot-password in login URL
      const params = new URLSearchParams(location.search);
      if (params.get('action') === 'forgot-password') {
        setMode('forgot');
      } else {
        setMode('login');
      }
    }
  }, [location.pathname, location.search, queryEmail, queryMode]);

  // ── OTP Auto-focus & Dev Fallback ──────────────────────────────────────────
  useEffect(() => {
    if ((mode === 'verify' || mode === 'reset_verify') && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [mode]);

  useEffect(() => {
    if (devOtp && /^\d{6}$/.test(devOtp)) {
      setDigits(devOtp.split(''));
    }
  }, [devOtp]);

  // ── Resend Cooldown Countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ── Helper state-resetters ──────────────────────────────────────────────────
  const resetState = () => {
    setError('');
    setSuccessMsg('');
    setUnverifiedEmail('');
    setResendMsg('');
    setDigits(['', '', '', '', '', '']);
  };

  const switchMode = (newMode) => {
    resetState();
    setName('');
    setEmail('');
    setPassword('');
    setNewPassword('');
    setConfirmPass('');
    setShowReset(false);
    setMode(newMode);
    
    // Sync route path nicely without full reload
    if (newMode === 'verify') {
      navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
    } else if (newMode === 'reset_verify') {
      navigate(`/verify-email?email=${encodeURIComponent(email)}&mode=reset`, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  // ── Handlers: Login & Registration ─────────────────────────────────────────
  const handleLogin = async () => {
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.needsVerification) {
        setUnverifiedEmail(err.email || email);
        setError(err.message || 'Please verify your email before logging in.');
      } else {
        setError(err.message);
      }
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    try {
      const result = await register(name, email, password);
      resetState();
      setEmail(result.email);
      setMode('verify');
      const otpParam = result.devOtp ? `&devOtp=${result.devOtp}` : '';
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}${otpParam}`, { replace: true });
    } catch (err) {
      if (err.message && err.message.includes('not verified')) {
        setUnverifiedEmail(email);
        setError(err.message);
      } else {
        throw err;
      }
    }
  };

  const handleForgotPassword = async () => {
    try {
      const result = await forgotPassword(email);
      setSuccessMsg(result?.message || 'If this email is registered, a reset OTP has been sent. Check your inbox.');
      setTimeout(() => {
        resetState();
        setMode('reset_verify');
        const otpParam = result?.devOtp ? `&devOtp=${result.devOtp}` : '';
        navigate(`/verify-email?email=${encodeURIComponent(email)}&mode=reset${otpParam}`, { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetState();
    setLoading(true);
    try {
      if (mode === 'login')         await handleLogin();
      else if (mode === 'signup')   await handleRegister();
      else if (mode === 'forgot')   await handleForgotPassword();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers: Verification ─────────────────────────────────────────────────
  const handleDigitChange = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError('');

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...digits];
    pasted.split('').forEach((ch, i) => { newDigits[i] = ch; });
    setDigits(newDigits);
    const nextEmpty = newDigits.findIndex(d => !d);
    const focusIdx  = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs.current[focusIdx]?.focus();
  };

  const otpValue = digits.join('');

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpValue.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (mode === 'reset_verify') {
        // Correct OTP verified conceptually, reveal password resets
        setShowReset(true);
      } else {
        await verifyOtp(email, otpValue);
        setSuccess(true);
        setTimeout(() => navigate('/'), 2200);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPass) {
      setError('Passwords do not match.');
      return;
    }
    setResetLoading(true);
    setError('');
    try {
      await resetPassword(email, otpValue, newPassword);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        switchMode('login');
      }, 2200);
    } catch (err) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendOtpCall = async () => {
    if (cooldown > 0) return;
    setResendMsg('');
    setError('');
    try {
      if (mode === 'reset_verify') {
        const result = await resendResetOtp(email);
        if (result.devOtp) {
          setResendMsg(`Email delivery failed. Your OTP code is: ${result.devOtp}`);
          setDigits(result.devOtp.split(''));
        } else {
          setResendMsg('A new password reset OTP has been sent to your email.');
        }
      } else {
        const result = await resendOtp(email);
        if (result.devOtp) {
          setResendMsg(`Email delivery failed. Your OTP code is: ${result.devOtp}`);
          setDigits(result.devOtp.split(''));
        } else {
          setResendMsg('A new verification OTP has been sent to your email.');
        }
      }
      setCooldown(60);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Could not resend OTP. Please try again.');
    }
  };

  const handleResendFromBanner = async () => {
    setResendLoading(true);
    setError('');
    try {
      const result = await resendOtp(unverifiedEmail);
      setEmail(unverifiedEmail);
      setMode('verify');
      const otpParam = result.devOtp ? `&devOtp=${result.devOtp}` : '';
      navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}${otpParam}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // ── Dynamic Form UI Configuration ──────────────────────────────────────────
  const titles = {
    login:        'Sign In',
    signup:       'Create Account',
    forgot:       'Reset Password',
    verify:       'Verify Your Email',
    reset_verify: 'Reset Password'
  };

  const subtitles = {
    login:        'Welcome back to TFI_CONNECTS',
    signup:       'Join the ultimate Telugu cinema experience',
    forgot:       'Enter your email to receive a reset code',
    verify:       `We sent a 6-digit code to ${email}`,
    reset_verify: `We sent a reset code to ${email}`
  };

  const btnLabels = {
    login:        'Sign In',
    signup:       'Create Account',
    forgot:       'Send Reset Code'
  };

  // ── Render Success View Inline inside glass-panel ──────────────────────────
  if (success) {
    return (
      <div className="login-page">
        <div className="login-bg-overlay"></div>
        <div className="login-container">
          <div className="login-card glass-panel success-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div className="success-icon-wrap" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <CheckCircle size={56} className="success-icon" style={{ color: '#6ee7b7', filter: 'drop-shadow(0 0 16px rgba(110, 231, 183, 0.6))' }} />
            </div>
            <h2>{mode === 'reset_verify' ? 'Password Reset!' : 'Email Verified!'}</h2>
            <p style={{ color: '#888', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {mode === 'reset_verify'
                ? 'Your password has been updated. Redirecting to sign in…'
                : 'Your account is now active. Welcome to TFI_CONNECTS!'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isVerificationMode = mode === 'verify' || mode === 'reset_verify';

  return (
    <div className="login-page">
      <div className="login-bg-overlay"></div>

      <div className="login-header">
        <span className="logo-tfi">TFI</span>
        <span className="logo-connects">_CONNECTS</span>
      </div>

      <div className="login-container fade-in">
        <div className="login-card glass-panel">

          {/* Icon header */}
          {!isVerificationMode ? (
            <div className="login-icon-row">
              <Film size={28} className="login-icon" />
              <Clapperboard size={28} className="login-icon" />
            </div>
          ) : (
            <div className="verify-mail-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <Mail size={36} className="mail-icon" style={{ color: '#d4af37', filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.5))' }} />
            </div>
          )}

          {/* Back button */}
          {(mode === 'forgot' || isVerificationMode) && (
            <button
              className="back-btn"
              onClick={() => switchMode('login')}
              style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '0.875rem' }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          )}

          <h1>{titles[mode]}</h1>
          <p className="login-subtitle" style={{ wordBreak: 'break-all', marginBottom: '24px' }}>{subtitles[mode]}</p>

          {/* Unverified account banner (only on login mode) */}
          {!isVerificationMode && unverifiedEmail && (
            <div className="unverified-banner">
              <Mail size={16} style={{ flexShrink: 0 }} />
              <div>
                <p>Your account hasn't been verified yet.</p>
                <button
                  className="resend-link-btn"
                  onClick={handleResendFromBanner}
                  disabled={resendLoading}
                >
                  {resendLoading ? 'Sending…' : 'Resend verification email →'}
                </button>
              </div>
            </div>
          )}

          {/* Error / success messages */}
          {error      && <div className="login-error">{error}</div>}
          {successMsg && <div className="login-success">{successMsg}</div>}

          {/* Forms */}
          {!isVerificationMode ? (
            <form onSubmit={handleSubmit} className="login-form">
              {mode === 'signup' && (
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="login-input"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  required
                  autoComplete="email"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="input-group password-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )}

              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <span className="btn-spinner"></span> : btnLabels[mode]}
              </button>
            </form>
          ) : (
            // Verification Forms
            <div>
              {!showReset ? (
                <form onSubmit={handleVerifyOtp} className="verify-form">
                  {devOtp && (
                    <div style={{
                      background: 'rgba(234,179,8,0.12)',
                      border: '1px solid rgba(234,179,8,0.4)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fef08a',
                      fontSize: '0.85rem',
                      marginBottom: '16px',
                      textAlign: 'center'
                    }}>
                      ⚡ Dev Mode: Autocompleted OTP code
                    </div>
                  )}

                  <div className="otp-inputs" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        className={`otp-digit ${digit ? 'filled' : ''}`}
                        style={{
                          width: '50px',
                          height: '58px',
                          fontSize: '1.6rem',
                          fontWeight: '700',
                          textAlign: 'center',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1.5px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          outline: 'none',
                          transition: 'border-color 0.2s, background 0.2s'
                        }}
                      />
                    ))}
                  </div>

                  <button type="submit" className="verify-btn login-btn" disabled={loading || otpValue.length < 6}>
                    {loading ? <span className="btn-spinner"></span> : 'Verify Code'}
                  </button>

                  <div className="resend-section" style={{ textAlign: 'center', marginTop: '16px' }}>
                    {resendMsg && <p className="resend-ok" style={{ fontSize: '0.82rem', color: '#6ee7b7', marginBottom: '6px' }}>{resendMsg}</p>}
                    {cooldown > 0 ? (
                      <p className="resend-text" style={{ fontSize: '0.85rem', color: '#666' }}>
                        Resend code in <span className="resend-cooldown" style={{ color: '#555' }}>{cooldown}s</span>
                      </p>
                    ) : (
                      <button type="button" onClick={handleResendOtpCall} className="resend-btn" style={{ background: 'none', border: 'none', color: '#d4af37', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                // Step 2 of reset: Enter new password
                <form onSubmit={handleResetPasswordSubmit} className="login-form">
                  <div className="otp-summary" style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', padding: '8px 14px', fontSize: '0.82rem', color: '#d4af37', marginBottom: '20px', letterSpacing: '1px', textAlign: 'center' }}>
                    CODE VERIFIED
                  </div>

                  <div className="input-group">
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="login-input"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="input-group">
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      className="login-input"
                      required
                      minLength={6}
                    />
                  </div>

                  <button type="submit" className="login-btn" disabled={resetLoading}>
                    {resetLoading ? <span className="btn-spinner"></span> : 'Update Password'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Toggle login/signup link */}
          {!isVerificationMode && mode !== 'forgot' && (
            <div className="login-toggle">
              <span>{mode === 'login' ? 'New to TFI_CONNECTS? ' : 'Already have an account? '}</span>
              <button className="toggle-link" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                {mode === 'login' ? 'Sign Up Now' : 'Sign In'}
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'transparent', border: 'none', color: '#aaa', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Skip for now &amp; continue as Guest
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
