import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchFavourites, addFavourite, removeFavourite } from '../services/api';

export const useFavorites = () => {
  const auth = useAuth();
  const isLoggedIn = auth?.isAuthenticated;
  const token = auth?.token;

  const [favorites, setFavorites] = useState(() => {
    try {
      const item = window.localStorage.getItem('tfi_favorites');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error(error);
      return [];
    }
  });

  // Sync local storage whenever favorites change (for non-logged-in users)
  useEffect(() => {
    if (!isLoggedIn) {
      window.localStorage.setItem('tfi_favorites', JSON.stringify(favorites));
    }
  }, [favorites, isLoggedIn]);

  // Load server favourites when user logs in
  useEffect(() => {
    const loadServerFavs = async () => {
      if (isLoggedIn && token) {
        try {
          const serverFavs = await fetchFavourites(token);
          // Map server format to local format
          const mapped = serverFavs.map(f => ({
            id: f.movieId,
            title: f.title,
            poster: f.poster,
            rating: f.rating
          }));
          setFavorites(mapped);
        } catch (err) {
          console.error('Failed to load server favourites:', err);
        }
      }
    };
    loadServerFavs();
  }, [isLoggedIn, token]);

  const toggleFavorite = useCallback(async (movie) => {
    if (!movie || (!movie.id && !movie.movieId)) return;
    const targetId = String(movie.id || movie.movieId);
    const isFavorited = Array.isArray(favorites) && favorites.some((fav) => fav && String(fav.id || fav.movieId) === targetId);

    if (isFavorited) {
      // Remove
      setFavorites((prev) => (Array.isArray(prev) ? prev.filter((fav) => fav && String(fav.id || fav.movieId) !== targetId) : []));
      if (isLoggedIn && token) {
        try {
          await removeFavourite(movie.id || movie.movieId, token);
        } catch (err) {
          console.error('Failed to remove favourite from server:', err);
        }
      }
    } else {
      // Add
      const movieToSave = {
        id: movie.id || movie.movieId,
        title: movie.title || 'Movie',
        poster: movie.poster || movie.bgImage || '',
        rating: movie.rating || 9.0
      };
      setFavorites((prev) => (Array.isArray(prev) ? [...prev.filter(f => f && (f.id || f.movieId)), movieToSave] : [movieToSave]));
      if (isLoggedIn && token) {
        try {
          await addFavourite(movie, token);
        } catch (err) {
          console.error('Failed to add favourite to server:', err);
        }
      }
    }
  }, [favorites, isLoggedIn, token]);

  const isFavorite = useCallback((movieId) => {
    if (!Array.isArray(favorites) || !movieId) return false;
    return favorites.some((fav) => fav && String(fav.id || fav.movieId) === String(movieId));
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
};
