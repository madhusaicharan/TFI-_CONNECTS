const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// GET /api/favourites — Get user's favourites
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.favourites || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/favourites — Add movie to favourites
router.post('/', protect, async (req, res) => {
  try {
    const { movieId, title, poster, rating } = req.body;

    if (!movieId) {
      return res.status(400).json({ message: 'movieId is required' });
    }

    const user = await User.findById(req.user._id);

    // Check if already in favourites
    const alreadyFav = user.favourites.some(f => f.movieId === movieId);
    if (alreadyFav) {
      return res.status(400).json({ message: 'Movie is already in favourites' });
    }

    user.favourites.push({ movieId, title, poster, rating });
    await user.save();

    res.status(201).json(user.favourites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/favourites/:movieId — Remove movie from favourites
router.delete('/:movieId', protect, async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const user = await User.findById(req.user._id);

    user.favourites = user.favourites.filter(f => f.movieId !== movieId);
    await user.save();

    res.json(user.favourites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
