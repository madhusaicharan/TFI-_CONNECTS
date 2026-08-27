const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const { optionalAuth, protect } = require('../middleware/authMiddleware');
const {
  fetchMovieNews,
  fetchRedditPosts,
  fetchYouTubeVideos,
  fetchTrendingTweets,
  fetchBoxOfficeBuzz,
  fetchMemeShorts,
  fetchCuratedInstagram
} = require('../services/integrations');

// GET /api/social/news
router.get('/news', async (req, res) => {
  const news = await fetchMovieNews();
  res.json(news);
});

// GET /api/social/reddit
router.get('/reddit', async (req, res) => {
  const data = await fetchRedditPosts();
  res.json(data);
});

// GET /api/social/youtube
router.get('/youtube', async (req, res) => {
  const type = req.query.type || 'trailers'; // trailers or interviews
  const query = type === 'trailers' ? 'tollywood latest movie trailers' : 'tollywood latest celebrity interviews';
  const videos = await fetchYouTubeVideos(query, type);
  res.json(videos);
});

// GET /api/social/tweets
router.get('/tweets', async (req, res) => {
  const tweets = await fetchTrendingTweets();
  res.json(tweets);
});

// GET /api/social/boxoffice-buzz
router.get('/boxoffice-buzz', async (req, res) => {
  const buzz = await fetchBoxOfficeBuzz();
  res.json(buzz);
});

// GET /api/social/youtube-shorts
router.get('/youtube-shorts', async (req, res) => {
  const shorts = await fetchMemeShorts();
  res.json(shorts);
});

// GET /api/social/instagram
router.get('/instagram', async (req, res) => {
  const igPosts = await fetchCuratedInstagram();
  res.json(igPosts);
});

// Polls Endpoints

// GET /api/social/polls
router.get('/polls', async (req, res) => {
  try {
    const polls = await Poll.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/social/polls/:id/vote
router.post('/polls/:id/vote', protect, async (req, res) => {
  try {
    const { optionId } = req.body;
    const pollId = req.params.id;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    if (poll.voters.includes(userId)) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }

    const option = poll.options.id(optionId);
    if (!option) return res.status(404).json({ message: 'Option not found' });

    option.votes += 1;
    poll.totalVotes += 1;
    poll.voters.push(userId);
    
    await poll.save();
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/social/polls — Protected: authenticated users only (acts as admin seed route)
router.post('/polls', protect, async (req, res, next) => {
  try {
    const { question, options } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Question and at least 2 options are required' });
    }
    const poll = await Poll.create({ question, options });
    res.status(201).json(poll);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
