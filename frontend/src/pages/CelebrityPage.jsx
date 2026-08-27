import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCarousel from '../components/MovieCarousel';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchCelebrityById, fetchCelebrityByName } from '../services/api';
import './CelebrityPage.css';

const CelebrityPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [celebrity, setCelebrity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // If id is numeric, fetch by TMDB ID; otherwise treat as name
        const isNumericId = /^\d+$/.test(id);
        const data = isNumericId
          ? await fetchCelebrityById(id)
          : await fetchCelebrityByName(id);
        setCelebrity(data);
      } catch (err) {
        console.error('Failed to load celebrity:', err);
        setError('Failed to load celebrity details.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
    window.scrollTo(0, 0);
  }, [id]);

  const handleMovieClick = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  if (loading) {
    return (
      <div className="celebrity-page">
        <Navbar />
        <LoadingSpinner message="Loading celebrity..." />
      </div>
    );
  }

  if (error || !celebrity) {
    return (
      <div className="celebrity-page">
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <p style={{ color: '#888', fontSize: '1.1rem' }}>{error || 'Celebrity not found'}</p>
          <button onClick={() => navigate(-1)} style={{ background: '#e50914', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="celebrity-page">
      <Navbar />
      
      <div className="celebrity-header fade-in">
        <div className="celebrity-hero-bg" style={{ backgroundImage: `url(${celebrity.image})` }}>
          <div className="celebrity-vignette"></div>
        </div>

        <div className="celebrity-profile-container">
          <img src={celebrity.image} alt={celebrity.name} className="celebrity-profile-image" />
          <div className="celebrity-info">
            <h1 className="celebrity-name">{celebrity.name}</h1>
            <div className="celebrity-stats">
              <span className="stat">Age: {celebrity.age}</span>
              <span className="stat-divider">|</span>
              <span className="stat">Debut: {celebrity.debut}</span>
            </div>
            <p className="celebrity-bio">{celebrity.bio}</p>
          </div>
        </div>
      </div>

      <div className="celebrity-filmography">
        <MovieCarousel 
          title="Filmography" 
          movies={celebrity.movies} 
          onMovieClick={handleMovieClick} 
        />
      </div>

      <Footer />
    </div>
  );
};

export default CelebrityPage;
