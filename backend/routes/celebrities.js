const express = require('express');
const router = express.Router();
const Celebrity = require('../models/Celebrity');
const { fetchFromTMDB, IMAGE_BASE_URL } = require('../services/tmdb');

// ── Helper: map TMDB person data to our shape ─────────────────────────────────
const mapPerson = (fullData) => {
  const movies = fullData.movie_credits?.cast
    ?.filter((m) => m.poster_path)
    ?.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    ?.slice(0, 20)
    ?.map((m) => ({
      id: m.id,
      title: m.title,
      poster: `${IMAGE_BASE_URL}${m.poster_path}`,
      rating: m.vote_average ? parseFloat(m.vote_average.toFixed(1)) : 0,
    })) || [];

  return {
    id: fullData.id,
    name: fullData.name,
    image: fullData.profile_path
      ? `${IMAGE_BASE_URL}${fullData.profile_path}`
      : 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=500&q=80',
    bio: fullData.biography || `${fullData.name} is an acclaimed performer in Indian cinema.`,
    age: fullData.birthday
      ? new Date().getFullYear() - new Date(fullData.birthday).getFullYear()
      : 'Unknown',
    debut: fullData.birthday ? `Born: ${fullData.birthday}` : 'Unknown',
    movies,
  };
};

// ── GET /api/celebrities/id/:id ───────────────────────────────────────────────
// Fetch celebrity by numeric TMDB ID
router.get('/id/:id', async (req, res, next) => {
  try {
    const personId = parseInt(req.params.id, 10);
    if (!personId || isNaN(personId)) {
      return res.status(400).json({ success: false, message: 'Invalid celebrity ID' });
    }

    const data = await fetchFromTMDB(
      `/person/${personId}`,
      { append_to_response: 'movie_credits' },
      { teluguOnly: false }
    );

    if (data && data.id) return res.json(mapPerson(data));

    return res.status(404).json({ success: false, message: 'Celebrity not found' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/celebrities/:name ────────────────────────────────────────────────
// Search by name — SAFE: sanitised and length-limited before any regex usage
router.get('/:name', async (req, res, next) => {
  try {
    // ── Security fix: sanitize input before using in RegExp ───────────────────
    // 1. Limit length to prevent ReDoS via huge strings
    const rawName = String(req.params.name || '').trim().slice(0, 100);
    if (!rawName) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    // 2. Escape all regex special chars so user input is treated as literal text
    const escapedName = rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // ── MongoDB lookup with safe escaped regex ────────────────────────────────
    let celeb = await Celebrity.findOne({
      name: { $regex: new RegExp(escapedName, 'i') },
    });
    if (celeb) return res.json(celeb);

    // ── TMDB people search (no regex involved, just a search string) ──────────
    const data = await fetchFromTMDB(
      '/search/person',
      { query: rawName },
      { teluguOnly: false }
    );

    if (data?.results?.length > 0) {
      const person = data.results[0];
      const fullData = await fetchFromTMDB(
        `/person/${person.id}`,
        { append_to_response: 'movie_credits' },
        { teluguOnly: false }
      );
      if (fullData?.id) return res.json(mapPerson(fullData));
    }

    // ── Graceful fallback (not a hard 404, matches original behaviour) ─────────
    return res.json({
      name: rawName,
      image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=500&q=80',
      bio: `${rawName} is an acclaimed performer working in Telugu cinema.`,
      age: 'Unknown',
      debut: 'Unknown',
      movies: [],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
