const mongoose = require('mongoose');

const memeSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  imageUrl:    { type: String, required: true, maxlength: 2000 },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true, // replaces manual createdAt — adds createdAt + updatedAt automatically
});

// Index for default sort (newest first)
memeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Meme', memeSchema);
