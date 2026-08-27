import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../services/api';

const LOCAL_KEY = 'tfi_watchlist';

/**
 * useWatchlist
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the user's watchlist with:
 *  - localStorage fallback when unauthenticated
 *  - Server sync when authenticated (with optimistic updates)
 */
const useWatchlist = () => {
  const { token, isAuthenticated } = useAuth();

  const [watchlist, setWatchlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Load from server when auth status changes ─────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchWatchlist(token);
        setWatchlist(items || []);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(items || []));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, token]);

  // ── Persist to localStorage whenever list changes ─────────────────────────
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const isInWatchlist = useCallback(
    (movieId) => {
      if (!Array.isArray(watchlist) || !movieId) return false;
      return watchlist.some((m) => m && String(m.movieId || m.id) === String(movieId));
    },
    [watchlist]
  );

  const addMovie = useCallback(
    async (movie) => {
      if (isInWatchlist(movie.id || movie.movieId)) return;

      const item = {
        movieId: movie.id || movie.movieId,
        id: movie.id || movie.movieId,
        title: movie.title,
        poster: movie.poster,
        rating: movie.rating,
        addedAt: new Date().toISOString(),
      };

      // Optimistic update
      setWatchlist((prev) => [...prev, item]);

      if (isAuthenticated && token) {
        try {
          const updated = await addToWatchlist(movie, token);
          setWatchlist(updated);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
        } catch (err) {
          // Rollback on failure
          setWatchlist((prev) => prev.filter((m) => m.movieId !== item.movieId));
          setError(err.message);
        }
      }
    },
    [isInWatchlist, isAuthenticated, token]
  );

  const removeMovie = useCallback(
    async (movieId) => {
      const previous = watchlist;

      // Optimistic update
      setWatchlist((prev) => prev.filter((m) => m.movieId !== movieId && m.id !== movieId));

      if (isAuthenticated && token) {
        try {
          const updated = await removeFromWatchlist(movieId, token);
          setWatchlist(updated);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
        } catch (err) {
          // Rollback
          setWatchlist(previous);
          setError(err.message);
        }
      }
    },
    [watchlist, isAuthenticated, token]
  );

  const toggleWatchlist = useCallback(
    (movie) => {
      const id = movie.id || movie.movieId;
      if (isInWatchlist(id)) {
        removeMovie(id);
        return false;
      } else {
        addMovie(movie);
        return true;
      }
    },
    [isInWatchlist, addMovie, removeMovie]
  );

  return {
    watchlist,
    loading,
    error,
    isInWatchlist,
    addMovie,
    removeMovie,
    toggleWatchlist,
  };
};

export default useWatchlist;
