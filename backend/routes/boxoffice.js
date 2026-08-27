'use strict';

const express = require('express');
const router = express.Router();
const liveCinemaScraper = require('../services/liveCinemaScraper');

// Low TTL Cache Store (60 seconds)
let liveCache = null;
let cacheTimestamp = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// GET /api/boxoffice/live - Live Scraped Cinema Feed
router.get('/live', async (req, res) => {
  const { city = 'hyderabad', language = 'telugu', refresh = 'false' } = req.query;
  const now = Date.now();
  const forceRefresh = refresh === 'true';

  // Return cached result if valid and refresh not requested
  if (!forceRefresh && liveCache && cacheTimestamp && (now - cacheTimestamp < CACHE_TTL_MS)) {
    const ageSeconds = Math.floor((now - cacheTimestamp) / 1000);
    res.setHeader('X-Data-Source', 'LIVE_SCRAPE');
    res.setHeader('X-Scraped-At', liveCache.scrapedAt);
    res.setHeader('X-Cache-Status', 'HIT');
    res.setHeader('X-Cache-Age-Seconds', String(ageSeconds));
    return res.json(liveCache);
  }

  try {
    console.log(`[BoxOfficeRoute] Performing live stealth scrape for ${city} / ${language}...`);
    const scrapedData = await liveCinemaScraper.scrapeLiveMovies(city, language);

    if (!scrapedData || !scrapedData.movies || scrapedData.movies.length === 0) {
      throw new Error('Upstream live scrape returned empty movie set');
    }

    liveCache = scrapedData;
    cacheTimestamp = now;

    res.setHeader('X-Data-Source', 'LIVE_SCRAPE');
    res.setHeader('X-Scraped-At', scrapedData.scrapedAt);
    res.setHeader('X-Cache-Status', 'MISS');

    res.json(scrapedData);
  } catch (err) {
    console.error('[BoxOfficeRoute] Upstream Scrape Error:', err.message);
    
    // Strict Zero-Mock Policy: Return 502 Bad Gateway if live extraction fails
    res.setHeader('X-Data-Source', 'UPSTREAM_BLOCKED');
    return res.status(502).json({
      success: false,
      error: '502 Bad Gateway',
      message: 'Upstream Cinema Portal Scrape Blocked or Unavailable',
      details: err.message,
      scrapedAt: new Date().toISOString()
    });
  }
});

// GET /api/boxoffice/movie/:id/trends - Movie details
router.get('/movie/:id/trends', async (req, res) => {
  try {
    const movieId = req.params.id;
    if (liveCache && liveCache.movies) {
      const found = liveCache.movies.find(m => String(m.id) === String(movieId) || String(m.eventCode) === String(movieId));
      if (found) return res.json(found);
    }
    return res.status(404).json({ message: 'Live movie trend data not found in cache' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
