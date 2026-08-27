const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 8000, // 8-second request timeout — prevents the event loop from hanging
  headers: { 'User-Agent': 'TFI-Connects/1.0 (https://tfi-connects.vercel.app)' },
});

// In-memory cache (capped at MAX_CACHE_SIZE entries to prevent unbounded growth)
const MAX_CACHE_SIZE = 500;

// Memory Cache to prevent API rate limiting and IP blocks
const cache = {
  movies: {}, // Keyed by movie title (lowercase, no spaces)
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

const normalizeTitle = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// 1. Fetch T2BLive Data via WP Search RSS
const fetchT2BLiveData = async (movieTitle) => {
  try {
    const searchUrl = `https://t2blive.com/search/${encodeURIComponent(movieTitle)}+WW+Collections/feed/rss2/`;
    const feed = await parser.parseURL(searchUrl);
    
    if (!feed.items || feed.items.length === 0) return null;

    let maxCollection = 0;
    let verdict = null;

    // Loop through results
    for (const item of feed.items) {
      const text = `${item.title} ${item.contentSnippet}`;
      
      // If the article title contains the movie name
      if (item.title.toLowerCase().includes(movieTitle.toLowerCase())) {
        // Extract all Cr values
        const crMatches = [...text.matchAll(/([\d\.]+)\s*Cr/ig)];
        for (const match of crMatches) {
          const val = parseFloat(match[1]);
          if (val > maxCollection) maxCollection = val;
        }
        
        const verdictMatch = text.match(/Verdict\s*[:-]\s*([A-Za-z\s]+)/i);
        if (verdictMatch && !verdict) {
          verdict = verdictMatch[1].trim().toUpperCase();
        }
      }
    }
    
    return {
      collection: maxCollection > 0 ? `₹${maxCollection.toFixed(2)} Cr` : null,
      verdict: verdict || null,
      source: 'T2BLive (Telugu360 BO)'
    };
  } catch (err) {
    console.error(`Error fetching T2BLive RSS for ${movieTitle}:`, err.message);
    return null;
  }
};

// Main function to fetch box office data
const fetchBoxOfficeData = async (movieTitle) => {
  const normTitle = normalizeTitle(movieTitle);
  
  if (cache.movies[normTitle] && (Date.now() - cache.movies[normTitle].timestamp < CACHE_DURATION)) {
    return cache.movies[normTitle].data;
  }
  
  const t2bData = await fetchT2BLiveData(movieTitle);
  
  const mergedData = {
    budget: null, // Scraped dynamically from text if found, else TMDB
    collection: t2bData?.collection || null,
    verdict: t2bData?.verdict || null,
    source: t2bData ? t2bData.source : 'TMDB'
  };
  
  if (t2bData) {
    // Evict oldest entry when cache is full
    const keys = Object.keys(cache.movies);
    if (keys.length >= MAX_CACHE_SIZE) {
      const oldest = keys.reduce((a, b) =>
        cache.movies[a].timestamp < cache.movies[b].timestamp ? a : b
      );
      delete cache.movies[oldest];
    }
    cache.movies[normTitle] = {
      data: mergedData,
      timestamp: Date.now(),
    };
  }

  return mergedData;
};

module.exports = {
  fetchBoxOfficeData
};
