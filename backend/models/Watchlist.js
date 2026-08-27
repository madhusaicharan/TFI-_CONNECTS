const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  movieId: { type: Number, required: true },
  title:   { type: String },
  poster:  { type: String },
  rating:  { type: Number },
  addedAt: { type: Date, default: Date.now },
});

const userWatchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  items: [watchlistSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Watchlist', userWatchlistSchema);
