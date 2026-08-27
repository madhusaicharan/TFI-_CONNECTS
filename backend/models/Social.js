const mongoose = require('mongoose');

const socialSchema = new mongoose.Schema({
  type: { type: String, enum: ['tweet', 'meme'], required: true },
  author: { type: String },
  handle: { type: String },
  avatar: { type: String },
  content: { type: String },
  likes: { type: String },
  retweets: { type: String },
  time: { type: String },
  image: { type: String },
  caption: { type: String }
});

module.exports = mongoose.model('Social', socialSchema);
