import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCarousel from '../components/MovieCarousel';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchActionMovies, fetchSciFiMovies, fetchComedyMovies } from '../services/api';
import './MoviesPage.css';

const MoviesPage = () => {
  const [actionMovies, setActionMovies] = useState([]);
  const [sciFiMovies, setSciFiMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [action, scifi, comedy] = await Promise.all([
          fetchActionMovies(),
          fetchSciFiMovies(),
          fetchComedyMovies()
        ]);
        setActionMovies(action);
        setSciFiMovies(scifi);
        setComedyMovies(comedy);
      } catch (err) {
        console.error('Failed to load movies:', err);
        setError('Failed to load movies.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleMovieClick = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  if (loading) {
    return (
      <div className="movies-page">
        <Navbar />
        <LoadingSpinner message="Loading movies..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="movies-page">
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <p style={{ color: '#888', fontSize: '1.1rem' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ background: '#e50914', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="movies-page">
      <Navbar />
      
      {/* Netflix Sub-header */}
      <div className="movies-subheader fade-in">
        <h2 className="subheader-title">Movies</h2>
        <div className="genre-dropdown-container">
          <select 
            className="genre-dropdown" 
            value={selectedGenre} 
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="All">Genres</option>
            <option value="Action">Action</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Comedy">Comedy</option>
            <option value="Drama">Drama</option>
          </select>
        </div>
      </div>

      <div className="movies-rows">
        {selectedGenre === 'All' || selectedGenre === 'Action' ? (
          <MovieCarousel title="Action & Adventure" movies={actionMovies} onMovieClick={handleMovieClick} />
        ) : null}

        {selectedGenre === 'All' || selectedGenre === 'Sci-Fi' ? (
          <MovieCarousel title="Sci-Fi Masterpieces" movies={sciFiMovies} onMovieClick={handleMovieClick} />
        ) : null}

        {selectedGenre === 'All' || selectedGenre === 'Comedy' ? (
          <MovieCarousel title="Laugh Out Loud Comedies" movies={comedyMovies} onMovieClick={handleMovieClick} />
        ) : null}
      </div>

      <Footer />
    </div>
  );
};

export default MoviesPage;
