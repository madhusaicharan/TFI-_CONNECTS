import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useWatchlist from '../hooks/useWatchlist';
import { useToast } from '../context/ToastContext';
import { Play, BookmarkX, Clock } from 'lucide-react';
import './WatchlistPage.css';

const WatchlistPage = () => {
  const { watchlist, removeMovie, loading } = useWatchlist();
  const navigate = useNavigate();
  const toast = useToast();

  const handleRemove = (movie) => {
    removeMovie(movie.movieId || movie.id);
    toast.info(`"${movie.title}" removed from your watchlist`);
  };

  return (
    <div className="watchlist-page">
      <Navbar />

      <div className="watchlist-container fade-in">
        <div className="watchlist-header">
          <h1 className="watchlist-title">
            <Clock size={28} className="watchlist-icon" />
            My Watchlist
          </h1>
          <p className="watchlist-count">
            {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'} saved
          </p>
        </div>

        {loading ? (
          <div className="watchlist-loading">
            <div className="wl-spinner" />
            <p>Loading your watchlist…</p>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="empty-watchlist">
            <div className="empty-watchlist-icon">🎬</div>
            <h2>Your watchlist is empty</h2>
            <p>Save movies to watch later. Tap the bookmark icon on any movie card.</p>
            <button className="btn-explore" onClick={() => navigate('/')}>
              Discover Movies
            </button>
          </div>
        ) : (
          <div className="watchlist-grid">
            {watchlist.map((movie) => (
              <div
                key={movie.movieId || movie.id}
                className="wl-card"
              >
                <div
                  className="wl-card-poster-wrap"
                  onClick={() => navigate(`/movie/${movie.movieId || movie.id}`)}
                >
                  <img
                    src={movie.poster || 'https://via.placeholder.com/200x300?text=No+Poster'}
                    alt={movie.title}
                    className="wl-poster"
                    loading="lazy"
                  />
                  <div className="wl-overlay">
                    <Play size={36} className="wl-play-icon" />
                  </div>
                </div>

                <div className="wl-card-info">
                  <span className="wl-title">{movie.title}</span>
                  {movie.rating > 0 && (
                    <span className="wl-rating">⭐ {movie.rating}</span>
                  )}
                </div>

                <button
                  className="wl-remove-btn"
                  onClick={() => handleRemove(movie)}
                  title="Remove from watchlist"
                  aria-label={`Remove ${movie.title} from watchlist`}
                >
                  <BookmarkX size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default WatchlistPage;
