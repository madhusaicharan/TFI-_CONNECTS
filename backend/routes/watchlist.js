const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const { protect } = require('../middleware/authMiddleware');

// All watchlist routes require authentication
router.use(protect);

// GET /api/watchlist — Get user's watchlist
router.get('/', async (req, res, next) => {
  try {
    const watchlist = await Watchlist.findOne({ userId: req.user._id });
    res.json(watchlist?.items || []);
  } catch (err) {
    next(err);
  }
});

// POST /api/watchlist — Add movie to watchlist
router.post('/', async (req, res, next) => {
  try {
    const { movieId, title, poster, rating } = req.body;

    if (!movieId) {
      return res.status(400).json({ success: false, message: 'movieId is required' });
    }

    let watchlist = await Watchlist.findOne({ userId: req.user._id });

    if (!watchlist) {
      watchlist = new Watchlist({ userId: req.user._id, items: [] });
    }

    // Prevent duplicates
    const alreadyIn = watchlist.items.some((item) => item.movieId === movieId);
    if (alreadyIn) {
      return res.status(400).json({ success: false, message: 'Movie is already in your watchlist' });
    }

    watchlist.items.push({ movieId, title, poster, rating });
    await watchlist.save();

    res.status(201).json(watchlist.items);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/watchlist/:movieId — Remove movie from watchlist
router.delete('/:movieId', async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId, 10);
    if (isNaN(movieId)) {
      return res.status(400).json({ success: false, message: 'Invalid movieId' });
    }

    const watchlist = await Watchlist.findOne({ userId: req.user._id });
    if (!watchlist) {
      return res.json([]);
    }

    watchlist.items = watchlist.items.filter((item) => item.movieId !== movieId);
    await watchlist.save();

    res.json(watchlist.items);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
