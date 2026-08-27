const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't return password by default
  },
  avatar: {
    type: String,
    default: function() {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(this.name)}&backgroundColor=b6e3f4`;
    }
  },
  favourites: [{
    movieId: { type: Number, required: true },
    title: { type: String },
    poster: { type: String },
    rating: { type: Number },
    addedAt: { type: Date, default: Date.now }
  }],

  // ── Email Verification ────────────────────────────────────────────────────
  isVerified: {
    type: Boolean,
    default: false
  },
  // SHA-256 hash of the 6-digit OTP (plaintext never stored)
  otp: {
    type: String,
    select: false
  },
  otpExpiry: {
    type: Date,
    select: false
  },
  // Rate-limit: max 3 resend requests per 15-minute window
  otpResendCount: {
    type: Number,
    default: 0
  },
  otpResendWindowStart: {
    type: Date
  },

  // ── Password Reset ────────────────────────────────────────────────────────
  passwordResetOtp: {
    type: String,
    select: false
  },
  passwordResetExpiry: {
    type: Date,
    select: false
  },

  // ── Login Tracking ────────────────────────────────────────────────────────
  lastLoginAt: {
    type: Date
  }

}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
