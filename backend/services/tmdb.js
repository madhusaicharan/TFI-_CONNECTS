const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.tmdb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

const genreMap = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

const mapMovie = (movie) => {
  return {
    id: movie.id,
    title: movie.title,
    poster: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=300&q=80',
    bgImage: movie.backdrop_path ? `${BACKDROP_BASE_URL}${movie.backdrop_path}` : null,
    rating: movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : 0,
    year: movie.release_date ? movie.release_date.split('-')[0] : 'Unknown',
    genres: movie.genre_ids
      ? movie.genre_ids.map(id => genreMap[id]).filter(Boolean)
      : (movie.genres ? movie.genres.map(g => g.name) : []),
    description: movie.overview,
    overview: movie.overview,
    releaseYear: movie.release_date ? movie.release_date.split('-')[0] : 'Unknown',
  };
};

/**
 * Fetch data from TMDB API.
 * @param {string} endpoint - API path (e.g. '/trending/movie/week')
 * @param {object} params - Query params to merge
 * @param {object} options - { teluguOnly: true } to filter by Telugu language
 */
const fetchFromTMDB = async (endpoint, params = {}, options = {}) => {
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params
  });

  // Only add Telugu language filter for discovery/list endpoints, not for
  // individual movie/person lookups or search
  if (options.teluguOnly !== false) {
    const isDiscoveryEndpoint = endpoint.includes('/discover/') ||
      endpoint.includes('/trending/') ||
      endpoint.includes('/now_playing') ||
      endpoint.includes('/popular') ||
      endpoint.includes('/top_rated');
    
    if (isDiscoveryEndpoint) {
      queryParams.set('with_original_language', 'te');
    }
  }

  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      console.error(`TMDB HTTP Error: ${response.status} for ${endpoint}`);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`TMDB Fetch Error [${endpoint}]:`, error.message || error);
    return null;
  }
};

module.exports = {
  fetchFromTMDB,
  mapMovie,
  IMAGE_BASE_URL,
  BACKDROP_BASE_URL
};
