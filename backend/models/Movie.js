const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  id:       { type: Number, required: true },
  title:    { type: String, required: true, trim: true },
  poster:   { type: String },
  bgImage:  { type: String },
  rating:   { type: Number, default: 0 },
  year:     { type: String },
  genres:   [{ type: String }],
  overview: { type: String },
  description: { type: String },
  releaseYear: { type: String },
  category: { type: String, index: true }, // frequently queried
}, {
  timestamps: true,
});

// Compound index for category + id lookups (the most common fallback query)
movieSchema.index({ category: 1, id: 1 });
// Text index for RAG retrieval covering title, overview, and genres
movieSchema.index({ title: 'text', overview: 'text', genres: 'text' }, { weights: { title: 10, genres: 5, overview: 1 } });

module.exports = mongoose.model('Movie', movieSchema);
