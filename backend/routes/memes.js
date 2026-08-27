const express = require('express');
const router = express.Router();
const Meme = require('../models/Meme');
const { protect } = require('../middleware/authMiddleware');

// GET /api/memes - Fetch user-submitted memes
router.get('/', async (req, res) => {
  try {
    const memes = await Meme.find()
      .populate('submittedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(memes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/memes - Submit a new meme
router.post('/', protect, async (req, res) => {
  try {
    const { title, imageUrl } = req.body;
    
    if (!title || !imageUrl) {
      return res.status(400).json({ message: 'Title and Image URL are required' });
    }

    const meme = new Meme({
      title,
      imageUrl,
      submittedBy: req.user._id
    });

    await meme.save();
    
    // Populate user info before returning
    await meme.populate('submittedBy', 'name');
    
    res.status(201).json(meme);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/memes/:id/like - Toggle like on a meme
router.post('/:id/like', protect, async (req, res) => {
  try {
    const meme = await Meme.findById(req.params.id);
    
    if (!meme) {
      return res.status(404).json({ message: 'Meme not found' });
    }

    const userId = req.user._id;
    const index = meme.likes.indexOf(userId);

    if (index === -1) {
      meme.likes.push(userId); // Like
    } else {
      meme.likes.splice(index, 1); // Unlike
    }

    await meme.save();
    res.json(meme);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
