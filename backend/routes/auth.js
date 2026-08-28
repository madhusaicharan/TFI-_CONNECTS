/**
 * routes/auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Authentication routes for TFI_CONNECTS.
 *
 * Endpoints:
 *   POST /api/auth/register           — Create account, send OTP
 *   POST /api/auth/login              — Login (blocked if unverified), sends login alert
 *   GET  /api/auth/me                 — Get current user (protected)
 *   POST /api/auth/verify-email       — Verify OTP, activate account, return JWT
 *   POST /api/auth/resend-verification— Resend OTP (rate-limited: 3/15 min per email)
 *   POST /api/auth/forgot-password    — Send password-reset OTP
 *   POST /api/auth/reset-password     — Verify OTP + update password
 *   GET  /api/auth/health             — Health check (DB + SMTP status)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express   = require('express');
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');
const router    = express.Router();

const User     = require('../models/User');
const { protect, JWT_SECRET } = require('../middleware/authMiddleware');

const nodemailer = require('nodemailer');
const crypto     = require('crypto');

// ── Env-var driven config ────────────────────────────────────────────────────
const rawEmailFrom = process.env.EMAIL_FROM || '';
const extractedEmail = rawEmailFrom.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

const SMTP_HOST   = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT   = process.env.SMTP_PORT || '587';
const SMTP_SECURE = process.env.SMTP_SECURE || 'false';
const SMTP_USER   = process.env.SMTP_USER || (extractedEmail ? extractedEmail[1] : null);
const SMTP_PASS   = process.env.SMTP_PASS;
const CLIENT_URL  = process.env.CLIENT_URL || 'https://tfi-connects.vercel.app';

const SENDER_EMAIL = (SMTP_USER || (extractedEmail ? extractedEmail[1] : 'madhusaicharan2003@gmail.com')).trim();
const EMAIL_FROM = `"TFI_CONNECTS" <${SENDER_EMAIL}>`;

function isSmtpConfigured() {
  if (!SMTP_USER || !SMTP_PASS) return false;
  const placeholders = ['your_gmail', 'your_email', 'example', 'placeholder', 'your_6_char', 'your_app_password', 'xxxx'];
  const lower = (SMTP_USER + (SMTP_PASS || '')).toLowerCase();
  return !placeholders.some(p => lower.includes(p));
}

let _transporterCache = null;

function buildTransportConfig(forceDirect = false) {
  const cleanUser = (SMTP_USER || '').trim();
  const cleanPass = (SMTP_PASS || '').replace(/\s+/g, '');

  const isGmail = (SMTP_HOST && SMTP_HOST.includes('gmail')) || (cleanUser && cleanUser.includes('@gmail.com'));

  if (isGmail && !forceDirect) {
    console.log(`[emailService] Using service: 'gmail' for user=${cleanUser}`);
    return {
      service: 'gmail',
      auth: { user: cleanUser, pass: cleanPass },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      tls: { rejectUnauthorized: false }
    };
  }

  const portNum = parseInt(process.env.SMTP_PORT || '465', 10);
  const isSecure = process.env.SMTP_SECURE === 'true' || portNum === 465;

  console.log(`[emailService] Config: host=${SMTP_HOST || 'smtp.gmail.com'}, port=${portNum}, secure=${isSecure}, user=${cleanUser}`);

  return {
    host:   SMTP_HOST || 'smtp.gmail.com',
    port:   portNum,
    secure: isSecure,
    auth: { user: cleanUser, pass: cleanPass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: false
    }
  };
}

function createTransporter(forceNew = false, forceDirect = false) {
  if (!isSmtpConfigured()) {
    console.warn('[emailService] ⚠️ SMTP_USER or SMTP_PASS missing or placeholder — emails will not be sent.');
    return null;
  }

  if (_transporterCache && !forceNew) return _transporterCache;

  if (_transporterCache && forceNew) {
    try { _transporterCache.close(); } catch (_) {}
    _transporterCache = null;
  }

  _transporterCache = nodemailer.createTransport(buildTransportConfig(forceDirect));
  return _transporterCache;
}

// Verify SMTP connection on startup (non-blocking)
(async () => {
  if (!isSmtpConfigured()) return;
  try {
    const t = createTransporter();
    if (t) {
      await t.verify();
      console.log('[emailService] ✅ SMTP connection verified on startup');
    }
  } catch (err) {
    console.error('[emailService] ⚠️ SMTP startup verification failed:', err.message);
    console.error('[emailService] Ensure SMTP_PASS is a 16-character Gmail App Password.');
  }
})();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BREVO_API_KEY  = process.env.BREVO_API_KEY;

async function sendViaHttpApi(mailOptions) {
  const { to, subject, html } = mailOptions;

  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'TFI_CONNECTS <onboarding@resend.dev>',
          to: [to],
          subject,
          html
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[httpEmail] ✅ Sent via Resend to ${to} (id: ${data.id})`);
        return { sent: true, messageId: data.id };
      }
      console.error(`[httpEmail] ❌ Resend error:`, data);
    } catch (err) {
      console.error(`[httpEmail] ❌ Resend network error:`, err.message);
    }
  }

  if (BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'TFI_CONNECTS', email: SENDER_EMAIL },
          to: [{ email: to }],
          subject,
          htmlContent: html
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[httpEmail] ✅ Sent via Brevo to ${to} (messageId: ${data.messageId})`);
        return { sent: true, messageId: data.messageId };
      }
      console.error(`[httpEmail] ❌ Brevo error:`, data);
    } catch (err) {
      console.error(`[httpEmail] ❌ Brevo network error:`, err.message);
    }
  }

  return { sent: false };
}

/**
 * Send an email with HTTP API priority and fast SMTP fallback.
 */
async function sendMailWithRetry(mailOptions) {
  // 1. Try HTTPS API first if configured (100% reliable on Render)
  if (RESEND_API_KEY || BREVO_API_KEY) {
    const httpResult = await sendViaHttpApi(mailOptions);
    if (httpResult.sent) return httpResult;
  }

  // 2. Try Nodemailer SMTP with 6s timeout
  let transporter = createTransporter();
  if (!transporter) return { sent: false, error: 'No transporter configured' };

  try {
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP timeout after 6s (Render outbound firewall blocked)')), 6000)
    );
    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`[emailService] ✅ Email sent to ${mailOptions.to} (messageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (firstErr) {
    console.error(`[emailService] ❌ SMTP attempt failed for ${mailOptions.to}: ${firstErr.message}`);
    return { sent: false, error: firstErr.message };
  }
}

function generateOTP() {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
}

function hashOTP(plaintext) {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

function emailLayout(bodyHtml) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TFI_CONNECTS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0f;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #e0e0e0;
    }
    .wrapper {
      max-width: 580px;
      margin: 30px auto;
      background: #111118;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(212, 175, 55, 0.2);
    }
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 32px 40px;
      text-align: center;
      border-bottom: 2px solid rgba(212, 175, 55, 0.4);
    }
    .logo-tfi  { font-size: 28px; font-weight: 900; color: #d4af37; letter-spacing: 3px; }
    .logo-con  { font-size: 28px; font-weight: 300; color: #e0e0e0; letter-spacing: 3px; }
    .tagline   { font-size: 11px; color: rgba(212,175,55,0.6); letter-spacing: 2px; margin-top: 6px; text-transform: uppercase; }
    .content   { padding: 40px; }
    .content h2 { font-size: 22px; color: #d4af37; margin-bottom: 12px; }
    .content p  { font-size: 15px; line-height: 1.7; color: #b0b0c0; margin-bottom: 16px; }
    .otp-box {
      background: linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03));
      border: 2px solid rgba(212,175,55,0.5);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label { font-size: 13px; color: #888; letter-spacing: 1px; text-transform: uppercase; }
    .otp-code  { font-size: 42px; font-weight: 900; color: #d4af37; letter-spacing: 10px; margin: 8px 0; font-family: 'Courier New', monospace; }
    .otp-expiry { font-size: 12px; color: #666; }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #d4af37, #c9a227);
      color: #0a0a0f;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }
    .alert-box {
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 10px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
    .detail-label { color: #888; }
    .detail-value { color: #e0e0e0; font-weight: 600; }
    .order-item { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 24px 0; }
    .footer {
      background: #0d0d14;
      padding: 24px 40px;
      text-align: center;
      font-size: 12px;
      color: #444;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .footer a { color: #d4af37; text-decoration: none; }
    .security-note { font-size: 12px; color: #555; background: rgba(255,255,255,0.02); border-radius: 8px; padding: 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div>
        <span class="logo-tfi">TFI</span><span class="logo-con">_CONNECTS</span>
      </div>
      <div class="tagline">The Ultimate Telugu Cinema Experience</div>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} TFI_CONNECTS. All rights reserved.</p>
      <p style="margin-top:6px;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendVerificationEmail(email, name) {
  const otp = generateOTP();
  const transporter = createTransporter();
  if (!transporter) return { otp, sent: false };

  const html = emailLayout(`
    <h2>Verify Your Account</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>
      Welcome to <strong>TFI_CONNECTS</strong>! You're just one step away from unlocking
      the full Telugu cinema experience. Use the OTP below to verify your email address.
    </p>

    <div class="otp-box">
      <div class="otp-label">Your Verification Code</div>
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏱ Valid for <strong>10 minutes</strong> only</div>
    </div>

    <p>Enter this code on the verification page to activate your account.</p>

    <div class="security-note">
      🔒 <strong>Security tip:</strong> Never share this OTP with anyone.
      TFI_CONNECTS will never ask for your OTP via phone or chat.
    </div>
  `);

  const result = await sendMailWithRetry({
    from:    EMAIL_FROM,
    to:      email,
    subject: `${otp} is your TFI_CONNECTS verification code`,
    html
  });

  if (result.sent) {
    console.log(`[sendVerificationEmail] ✅ Email delivered to ${email}`);
  } else {
    console.error(`[sendVerificationEmail] ❌ Email failed for ${email}: ${result.error}`);
  }

  return { otp, sent: result.sent };
}

async function sendLoginAlertEmail(email, name, loginInfo) {
  if (!isSmtpConfigured()) return;

  const { ip = 'Unknown', time = new Date().toUTCString(), userAgent = 'Unknown browser' } = loginInfo;

  const html = emailLayout(`
    <h2>New Login Detected</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>We noticed a new sign-in to your TFI_CONNECTS account. Here are the details:</p>

    <div class="alert-box">
      <div class="detail-row">
        <span class="detail-label">📅 Time</span>
        <span class="detail-value">${time}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🌐 IP Address</span>
        <span class="detail-value">${ip}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">💻 Device/Browser</span>
        <span class="detail-value">${userAgent.substring(0, 60)}...</span>
      </div>
    </div>

    <p>If this was <strong>you</strong>, no action is needed.</p>
    <p>
      If this <strong>wasn't you</strong>, secure your account immediately by resetting your password:
    </p>
    <p style="margin-top:20px; text-align:center;">
      <a href="${CLIENT_URL}/login?action=forgot-password" class="btn">
        Reset My Password
      </a>
    </p>

    <div class="security-note">
      🔒 If you believe your account is compromised, change your password immediately and
      contact our support team.
    </div>
  `);

  await sendMailWithRetry({
    from:    EMAIL_FROM,
    to:      email,
    subject: 'New login to your TFI_CONNECTS account',
    html
  });
}

async function sendPasswordResetEmail(email, name) {
  const otp = generateOTP();

  const html = emailLayout(`
    <h2>Reset Your Password</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>
      We received a request to reset your TFI_CONNECTS password.
      Use the code below to complete the process.
    </p>

    <div class="otp-box">
      <div class="otp-label">Password Reset Code</div>
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏱ Valid for <strong>15 minutes</strong> only</div>
    </div>

    <p>
      If you did not request a password reset, you can safely ignore this email.
      Your password will <strong>not</strong> be changed.
    </p>

    <div class="security-note">
      🔒 <strong>Security tip:</strong> Never share this code with anyone.
      TFI_CONNECTS staff will never ask for your reset code.
    </div>
  `);

  const result = await sendMailWithRetry({
    from:    EMAIL_FROM,
    to:      email,
    subject: `${otp} is your TFI_CONNECTS password reset code`,
    html
  });

  if (!result.sent) {
    console.error(`[sendPasswordResetEmail] ❌ Email failed for ${email}: ${result.error}`);
    console.log(`[sendPasswordResetEmail] ⚠️ DEV FALLBACK — Reset OTP for ${email}: ${otp}`);
  }

  return { otp, sent: result.sent };
}

async function sendOrderConfirmationEmail(email, name, orderDetails) {
  const transporter = createTransporter();
  if (!transporter) return;

  const {
    orderId      = 'N/A',
    items        = [],
    total        = 0,
    currency     = '₹',
    estimatedTime,
    bookingType  = 'Order'
  } = orderDetails;

  const itemsHtml = items.map(item => `
    <div class="order-item">
      <div class="detail-row">
        <span class="detail-label">${item.title} × ${item.qty || 1}</span>
        <span class="detail-value">${currency}${item.price}</span>
      </div>
    </div>
  `).join('');

  const html = emailLayout(`
    <h2>${bookingType} Confirmed! 🎬</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>
      Your ${bookingType.toLowerCase()} has been confirmed. Here's a summary:
    </p>

    <div class="detail-row" style="margin: 20px 0 8px;">
      <span class="detail-label">Order ID</span>
      <span class="detail-value" style="color:#d4af37;">#${orderId}</span>
    </div>

    <hr class="divider" />

    ${itemsHtml}

    <hr class="divider" />

    <div class="detail-row">
      <span class="detail-label" style="font-size:16px; font-weight:700; color:#e0e0e0;">Total</span>
      <span class="detail-value" style="font-size:18px; color:#d4af37;">${currency}${total}</span>
    </div>

    ${estimatedTime ? `
    <div class="alert-box" style="margin-top:20px; background:rgba(212,175,55,0.06); border-color:rgba(212,175,55,0.25);">
      <div class="detail-row" style="margin:0;">
        <span class="detail-label">⏱ Estimated Time</span>
        <span class="detail-value">${estimatedTime}</span>
      </div>
    </div>` : ''}

    <p style="margin-top:24px;">
      Thank you for using TFI_CONNECTS. Enjoy the movie! 🍿
    </p>

    <div class="security-note">
      Keep this email as your booking confirmation. Order ID: <strong>#${orderId}</strong>
    </div>
  `);

  await transporter.sendMail({
    from:    EMAIL_FROM,
    to:      email,
    subject: `${bookingType} Confirmed — #${orderId} | TFI_CONNECTS`,
    html
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

const publicUser = (user) => ({
  _id:        user._id,
  name:       user.name,
  email:      user.email,
  avatar:     user.avatar,
  isVerified: user.isVerified
});

/** Check if MongoDB is currently connected */
const isDbConnected = () => mongoose.connection.readyState === 1;

// ── Per-route Rate Limiters ───────────────────────────────────────────────────

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // increased for dev testing
  message: { message: 'Too many requests from this IP. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // increased for dev testing
  message: { message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/auth/health  — Quick diagnostic endpoint
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/health', (req, res) => {
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    db: dbStates[mongoose.connection.readyState] || 'unknown',
    smtp: isSmtpConfigured(),
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/auth/test-smtp  — Direct test email endpoint with detailed diagnostics
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/test-smtp', async (req, res) => {
  const targetEmail = req.query.to || SENDER_EMAIL;
  try {
    if (!isSmtpConfigured()) {
      return res.status(500).json({ success: false, error: 'SMTP is not configured on server.' });
    }
    const result = await sendMailWithRetry({
      from: EMAIL_FROM,
      to: targetEmail,
      subject: `TFI_CONNECTS Live Verification Test Code: ${generateOTP()}`,
      html: `<h2>TFI_CONNECTS Live Verification</h2><p>This is a live email test delivered directly to <strong>${targetEmail}</strong>.</p>`
    });
    return res.json({
      success: result.sent,
      messageId: result.messageId || null,
      error: result.error || null,
      to: targetEmail,
      from: EMAIL_FROM
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────════════════
router.post('/register', authLimiter, async (req, res) => {
  // Guard: DB must be connected
  if (!isDbConnected()) {
    return res.status(503).json({
      message: 'Database is not connected. Please check your MongoDB Atlas IP whitelist and try again.'
    });
  }

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (!existingUser.isVerified) {
        return res.status(400).json({
          message: 'Account exists but is not verified. Please check your email or resend OTP.',
          needsVerification: true,
          email: existingUser.email
        });
      }
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create user — password hashed by Mongoose pre-save hook
    const user = await User.create({ name, email: normalizedEmail, password, isVerified: false });

    // Generate OTP and try to send email
    let plainOtp = null;
    let emailSent = false;

    try {
      const result = await sendVerificationEmail(user.email, user.name);
      plainOtp = result.otp;
      emailSent = result.sent;
    } catch (err) {
      console.error('[register] sendVerificationEmail threw:', err.message);
      plainOtp = generateOTP();
    }

    // Hash and store OTP regardless of email send status
    user.otp                  = hashOTP(plainOtp);
    user.otpExpiry            = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    user.otpResendCount       = 1;
    user.otpResendWindowStart = new Date();
    await user.save();

    const responseBody = {
      message: emailSent
        ? 'Account created! Check your email for a 6-digit verification code.'
        : 'Account created! Email delivery failed — use the code shown below to verify.',
      needsVerification: true,
      email: user.email,
      emailSent
    };

    // If email was NOT sent, include OTP directly in response so user isn't stuck
    if (!emailSent) {
      responseBody.devOtp = plainOtp;
      console.log(`[register] ⚠️ Email failed — OTP for ${user.email}: ${plainOtp}`);
    }

    return res.status(201).json(responseBody);

  } catch (err) {
    console.error('[register] Unhandled error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    return res.status(500).json({ message: 'Server error during registration: ' + err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/login', authLimiter, async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      message: 'Database is not connected. Please check your MongoDB Atlas IP whitelist.'
    });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      if (!isSmtpConfigured() || process.env.AUTO_VERIFY === 'true') {
        console.log(`[login] ℹ️ Auto-verifying unverified user ${user.email} (SMTP unconfigured or AUTO_VERIFY set)`);
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
      } else {
        return res.status(403).json({
          message: 'Please verify your email before logging in.',
          needsVerification: true,
          email: user.email
        });
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Fire-and-forget login alert — never blocks the response
    const loginInfo = {
      ip:        req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown',
      time:      new Date().toUTCString(),
      userAgent: req.headers['user-agent'] || 'Unknown'
    };
    sendLoginAlertEmail(user.email, user.name, loginInfo).catch(err =>
      console.error('[login] Login alert email failed (non-blocking):', err.message)
    );

    return res.json({
      ...publicUser(user),
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error('[login] Error:', err);
    return res.status(500).json({ message: 'Server error during login: ' + err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/auth/me
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/me', protect, async (req, res) => {
  try {
    res.json(publicUser(req.user));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/verify-email
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify-email', otpLimiter, async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ message: 'Database is not connected.' });
  }

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const cleanOtp = String(otp).trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ message: 'OTP must be exactly 6 digits' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
                           .select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }
    if (user.isVerified) {
      return res.status(400).json({
        message: 'This account is already verified. Please log in.',
        alreadyVerified: true
      });
    }
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No active OTP found. Please request a new one.' });
    }
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const hashedInput = hashOTP(cleanOtp);
    if (hashedInput !== user.otp) {
      return res.status(400).json({ message: 'Incorrect OTP. Please check your email and try again.' });
    }

    // Mark verified, clear all OTP fields
    user.isVerified           = true;
    user.otp                  = undefined;
    user.otpExpiry            = undefined;
    user.otpResendCount       = 0;
    user.otpResendWindowStart = undefined;
    await user.save();

    return res.json({
      message: 'Email verified! Welcome to TFI_CONNECTS.',
      ...publicUser(user),
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error('[verify-email] Error:', err);
    return res.status(500).json({ message: 'Server error during verification: ' + err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/resend-verification
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/resend-verification', otpLimiter, async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ message: 'Database is not connected.' });
  }

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Enumeration prevention
      return res.json({ message: 'If this email is registered and unverified, a new OTP has been sent.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified. Please log in.' });
    }

    // Per-user sliding window limit
    const WINDOW_MS   = 15 * 60 * 1000;
    const MAX_RESENDS = 100; // increased for dev testing
    const now         = Date.now();
    const windowStart = user.otpResendWindowStart ? user.otpResendWindowStart.getTime() : 0;

    if (now - windowStart < WINDOW_MS && user.otpResendCount >= MAX_RESENDS) {
      const resetIn = Math.ceil((windowStart + WINDOW_MS - now) / 60000);
      return res.status(429).json({
        message: `Too many resend requests. Wait ${resetIn} minute(s) before trying again.`
      });
    }

    if (now - windowStart < WINDOW_MS) {
      user.otpResendCount += 1;
    } else {
      user.otpResendCount       = 1;
      user.otpResendWindowStart = new Date();
    }

    let plainOtp;
    let emailSent = false;
    try {
      const result = await sendVerificationEmail(user.email, user.name);
      plainOtp = result.otp;
      emailSent = result.sent;
    } catch (emailErr) {
      console.error('[resend-verification] Email send failed:', emailErr.message);
      plainOtp = generateOTP();
    }

    user.otp       = hashOTP(plainOtp);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const response = {
      message: emailSent
        ? 'A new verification OTP has been sent to your email.'
        : 'Email delivery failed — use the code shown below to verify.',
      emailSent
    };

    if (!emailSent) {
      response.devOtp = plainOtp;
      console.log(`[resend-verification] ⚠️ Email failed — OTP for ${user.email}: ${plainOtp}`);
    }

    return res.json(response);

  } catch (err) {
    console.error('[resend-verification] Error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/forgot-password', otpLimiter, async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ message: 'Database is not connected.' });
  }

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Enumeration prevention — always return 200
    if (!user) {
      return res.json({ message: 'If this email is registered, you will receive a reset OTP shortly.' });
    }

    let plainOtp;
    let emailSent = false;
    try {
      const sendResult = await sendPasswordResetEmail(user.email, user.name);
      plainOtp = sendResult.otp;
      emailSent = sendResult.sent;
    } catch (emailErr) {
      console.error('[forgot-password] Email send failed:', emailErr.message);
      plainOtp = generateOTP();
    }

    user.passwordResetOtp    = hashOTP(plainOtp);
    user.passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const responseBody = {
      message: emailSent
        ? 'If this email is registered, a reset OTP has been sent. Check your inbox.'
        : 'Email delivery failed — use the code shown below to reset password.',
      emailSent
    };

    if (!emailSent) {
      responseBody.devOtp = plainOtp;
      console.log(`[forgot-password] ⚠️ Email delivery failed — Reset OTP for ${user.email}: ${plainOtp}`);
    }

    return res.json(responseBody);

  } catch (err) {
    console.error('[forgot-password] Error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/reset-password', otpLimiter, async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ message: 'Database is not connected.' });
  }

  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const cleanOtp = String(otp).trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ message: 'OTP must be exactly 6 digits' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
                           .select('+passwordResetOtp +passwordResetExpiry');

    if (!user || !user.passwordResetOtp || !user.passwordResetExpiry) {
      return res.status(400).json({ message: 'Invalid or expired password reset request.' });
    }
    if (new Date() > user.passwordResetExpiry) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const hashedInput = hashOTP(cleanOtp);
    if (hashedInput !== user.passwordResetOtp) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    user.password            = newPassword; // Mongoose pre-save hook hashes it
    user.passwordResetOtp    = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    return res.json({ message: 'Password reset successfully! You can now log in.' });

  } catch (err) {
    console.error('[reset-password] Error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/resend-reset-otp
// — Resend a password-reset OTP (for use on the VerifyEmailPage in reset mode)
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/resend-reset-otp', otpLimiter, async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ message: 'Database is not connected.' });
  }

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Enumeration prevention — always return 200
    if (!user) {
      return res.json({ message: 'If this email is registered, a new reset OTP has been sent.' });
    }

    let plainOtp;
    try {
      plainOtp = await sendPasswordResetEmail(user.email, user.name);
    } catch (emailErr) {
      console.error('[resend-reset-otp] Email send failed:', emailErr.message);
      plainOtp = generateOTP();
    }

    user.passwordResetOtp    = hashOTP(plainOtp);
    user.passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const emailSent = isSmtpConfigured();
    if (!emailSent) {
      console.log(`[resend-reset-otp] ⚠️ DEV MODE — Reset OTP for ${user.email}: ${plainOtp}`);
    }

    return res.json({
      message: emailSent
        ? 'A new password reset OTP has been sent to your email.'
        : 'SMTP not configured — reset OTP logged to server console.',
      emailSent
    });

  } catch (err) {
    console.error('[resend-reset-otp] Error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;
