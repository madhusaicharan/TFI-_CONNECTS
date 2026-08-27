const mongoose = require('mongoose');

const celebritySchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  image: { type: String, required: true },
  bio:   { type: String, required: true },
  age:   { type: Number },
  debut: { type: String },
  movies: [{
    id:     Number,
    title:  String,
    poster: String,
    rating: Number,
  }],
}, {
  timestamps: true,
});

// Text index for full-text name search (faster than regex, used in /celebrities/:name)
celebritySchema.index({ name: 'text' });

module.exports = mongoose.model('Celebrity', celebritySchema);
