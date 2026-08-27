const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text:  { type: String, required: true, trim: true },
  votes: { type: Number, default: 0 },
});

const pollSchema = new mongoose.Schema({
  question:   { type: String, required: true, trim: true },
  options:    [optionSchema],
  totalVotes: { type: Number, default: 0 },
  voters:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive:   { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Index for fetching active polls sorted by newest
pollSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Poll', pollSchema);
