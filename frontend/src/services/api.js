const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper: safe fetch with error handling
const safeFetch = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error(`API Error [${url}]:`, err.message);
    throw err;
  }
};

// Helper: safe fetch that returns fallback on error (for non-critical data)
const safeFetchWithFallback = async (url, fallback = []) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return res.json();
  } catch (err) {
    console.error(`API Error [${url}]:`, err.message);
    return fallback;
  }
};

// ---- Movie endpoints ----

export const fetchHeroMovie = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/hero`, []);

export const fetchTrendingMovies = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/trending`, []);

export const fetchTop10 = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/top10`, []);

export const fetchNewReleases = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/new`, []);

export const fetchActionMovies = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/action`, []);

export const fetchUltraClassics = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/classic`, []);

export const fetchRomanticMovies = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/romance`, []);

export const fetchSciFiMovies = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/scifi`, []);

export const fetchComedyMovies = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/comedy`, []);

export const fetchMythologicalMovies = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/mythological`, []);

export const fetchDramaMovies = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/drama`, []);

export const fetchThrillerMovies = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/thriller`, []);

export const fetchCrimeMovies = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/crime`, []);

export const fetchFamilyMovies = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/family`, []);

export const fetchSuperheroMovies = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/superhero`, []);

export const fetchBlockbusters = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/blockbusters`, []);

export const fetchAwardWinners = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/awardwinners`, []);

export const fetchAllTimeBlockbusters = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/top10`, []);

export const fetchBoxOfficeStats = async () =>
  safeFetchWithFallback(`${API_URL}/boxoffice`, []);

export const fetchLiveBoxOffice = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = `${API_URL}/boxoffice/live${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `502 Bad Gateway - Upstream Cinema Portal Scrape Blocked`);
  }
  return res.json();
};

export const fetchMovieTrends = async (movieId) =>
  safeFetchWithFallback(`${API_URL}/boxoffice/movie/${movieId}/trends`, null);

export const fetchBoxOfficeCities = async () =>
  safeFetchWithFallback(`${API_URL}/boxoffice/cities`, { cities: [] });

export const fetchBoxOfficeTicker = async () =>
  safeFetchWithFallback(`${API_URL}/boxoffice/ticker`, null);

export const fetchMoviesByCategory = async (categoryKey) => {
  const mapping = {
    'new-releases': 'new',
    'action': 'action',
    'award-winners': 'awardwinners',
    'superhero': 'superhero',
    'comedy': 'comedy',
    'romance': 'romance',
    'crime': 'crime',
    'thriller': 'thriller',
    'scifi': 'scifi',
    'drama': 'drama',
    'family': 'family',
    'mythological': 'mythological',
    'classics': 'classic',
    'trending': 'trending',
    'top10': 'top10',
    'blockbusters': 'blockbusters',
  };
  const slug = mapping[categoryKey] || categoryKey;
  const res = await safeFetchWithFallback(`${API_URL}/movies/category/${slug}`, []);
  if (res && res.length > 0) return res;
  return safeFetchWithFallback(`${API_URL}/movies`, []);
};

// --- Social & Trending Endpoints ---

export const fetchTrendingSocial = async () => {
  try {
    const [tweets, redditData] = await Promise.all([
      safeFetch(`${API_URL}/social/tweets`),
      safeFetch(`${API_URL}/social/reddit`),
    ]);
    return {
      tweets: tweets || [],
      memes: redditData?.memes || [],
    };
  } catch (err) {
    console.error('Failed to fetch trending social data for Home:', err);
    return { tweets: [], memes: [] };
  }
};

export const fetchMovieNews = async () => {
  const data = await safeFetch(`${API_URL}/social/news`);
  return data || [];
};

export const fetchRedditMemes = async () => {
  const data = await safeFetch(`${API_URL}/social/reddit`);
  return data || { memes: [], discussions: [] };
};

export const fetchYouTubeVideos = async (type = 'trailers') => {
  const data = await safeFetch(`${API_URL}/social/youtube?type=${encodeURIComponent(type)}`);
  return data || [];
};

export const fetchTrendingTweets = async () => {
  const data = await safeFetch(`${API_URL}/social/tweets`);
  return data || [];
};

export const fetchBoxOfficeBuzz = async () => {
  const data = await safeFetch(`${API_URL}/social/boxoffice-buzz`);
  return data || [];
};

export const fetchPolls = async () => {
  const data = await safeFetch(`${API_URL}/social/polls`);
  return data || [];
};

export const voteOnPoll = async (pollId, optionId, token) => {
  const data = await safeFetch(`${API_URL}/social/polls/${pollId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ optionId }),
  });
  return data;
};

// --- Viral Memes Endpoints ---

export const fetchUserMemes = async () => {
  const data = await safeFetch(`${API_URL}/memes`);
  return data || [];
};

export const submitUserMeme = async (title, imageUrl, token) => {
  const data = await safeFetch(`${API_URL}/memes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, imageUrl }),
  });
  return data;
};

export const likeUserMeme = async (memeId, token) => {
  const data = await safeFetch(`${API_URL}/memes/${memeId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const fetchMemeShorts = async () => {
  const data = await safeFetch(`${API_URL}/social/youtube-shorts`);
  return data || [];
};

export const fetchCuratedInstagram = async () => {
  const data = await safeFetch(`${API_URL}/social/instagram`);
  return data || [];
};

export const fetchSocialTrending = fetchTrendingSocial;

export const fetchCelebrityById = async (id) =>
  safeFetch(`${API_URL}/celebrities/id/${id}`);

export const fetchCelebrityByName = async (name) =>
  safeFetch(`${API_URL}/celebrities/${encodeURIComponent(name)}`);

export const fetchMovieById = async (id) =>
  safeFetch(`${API_URL}/movies/id/${id}`);

export const fetchInTheatres = async () =>
  safeFetchWithFallback(`${API_URL}/movies/category/theatres`, []);

// ---- Search with closure-based debounce (avoids shared global state bugs) ----

export const searchMovies = async (query) => {
  if (!query) return [];
  return safeFetchWithFallback(
    `${API_URL}/movies/search?query=${encodeURIComponent(query)}`,
    []
  );
};

// Returns a cancel function — call it to abort a pending debounced search
export const searchMoviesDebounced = (query, callback) => {
  let timer;

  const execute = () => {
    clearTimeout(timer);
    if (!query) {
      callback([]);
      return;
    }
    timer = setTimeout(async () => {
      const results = await searchMovies(query);
      callback(results);
    }, 400);
  };

  execute();
  return () => clearTimeout(timer); // cancel function
};

// ---- Favourites (server-synced) ----

export const fetchFavourites = async (token) =>
  safeFetch(`${API_URL}/favourites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const addFavourite = async (movie, token) =>
  safeFetch(`${API_URL}/favourites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      movieId: movie.id,
      title: movie.title,
      poster: movie.poster,
      rating: movie.rating,
    }),
  });

export const removeFavourite = async (movieId, token) =>
  safeFetch(`${API_URL}/favourites/${movieId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

// ---- Watchlist (server-synced) ----

export const fetchWatchlist = async (token) =>
  safeFetch(`${API_URL}/watchlist`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const addToWatchlist = async (movie, token) =>
  safeFetch(`${API_URL}/watchlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      movieId: movie.id,
      title: movie.title,
      poster: movie.poster,
      rating: movie.rating,
    }),
  });

export const removeFromWatchlist = async (movieId, token) =>
  safeFetch(`${API_URL}/watchlist/${movieId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

