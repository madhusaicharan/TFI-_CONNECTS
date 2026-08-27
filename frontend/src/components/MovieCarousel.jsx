import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Plus, ThumbsUp, Info } from 'lucide-react';
import './MovieCarousel.css';

const MovieCarousel = ({ title, movies, categoryKey, onMovieClick }) => {
  const trackRef = useRef(null);
  const navigate = useNavigate();
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const hoverTimerRef = useRef(null);

  const getCategorySlug = () => {
    if (categoryKey) return categoryKey;
    const lower = (title || '').toLowerCase();
    if (lower.includes('new')) return 'new-releases';
    if (lower.includes('action')) return 'action';
    if (lower.includes('award')) return 'award-winners';
    if (lower.includes('hero') || lower.includes('legend')) return 'superhero';
    if (lower.includes('comed')) return 'comedy';
    if (lower.includes('roman')) return 'romance';
    if (lower.includes('crime')) return 'crime';
    if (lower.includes('suspense') || lower.includes('thriller')) return 'thriller';
    if (lower.includes('sci-fi') || lower.includes('fictional')) return 'scifi';
    if (lower.includes('drama')) return 'drama';
    if (lower.includes('family')) return 'family';
    if (lower.includes('mytholog')) return 'mythological';
    if (lower.includes('classic')) return 'classics';
    return 'movies';
  };

  const handleExploreClick = (e) => {
    e.stopPropagation();
    const slug = getCategorySlug();
    navigate(`/category/${slug}`);
  };

  const handleMouseEnter = (id) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHoveredId(id);
    }, 320);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredId(null);
  };

  const scroll = (dir) => {
    if (!trackRef.current) return;
    const scrollAmount = trackRef.current.clientWidth * 0.85;
    trackRef.current.scrollBy({ left: dir === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (trackRef.current) {
      setShowLeftArrow(trackRef.current.scrollLeft > 10);
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="carousel-section">
      <h2 className="section-title">
        <span style={{ cursor: 'pointer' }} onClick={handleExploreClick}>{title}</span>
        <span className="explore-all" style={{ cursor: 'pointer' }} onClick={handleExploreClick}>Explore All ›</span>
      </h2>
      <div className="carousel-container">
        {showLeftArrow && (
          <button className="carousel-arrow left" onClick={() => scroll('left')} aria-label="Scroll left">
            <ChevronLeft size={32} />
          </button>
        )}

        <div className="carousel-track" ref={trackRef} onScroll={handleScroll}>
          {movies.map((movie) => (
            <div
              key={movie.id}
              className={`nc-card ${hoveredId === movie.id ? 'nc-card--hovered' : ''}`}
              onMouseEnter={() => handleMouseEnter(movie.id)}
              onMouseLeave={handleMouseLeave}
              onClick={() => onMovieClick && onMovieClick(movie)}
            >
              {/* Poster */}
              <div className="nc-poster-wrap">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="nc-poster-img"
                  loading="lazy"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=80'; }}
                />
                <div className="nc-poster-gradient" />
              </div>

              {/* Title always visible below poster */}
              <p className="nc-card-title">{movie.title}</p>

              {/* Hover popup info panel */}
              <div className="nc-hover-panel">
                {/* Preview image at top of popup */}
                <div className="nc-hover-preview">
                  <img
                    src={movie.bgImage || movie.poster}
                    alt={movie.title}
                    className="nc-hover-preview-img"
                    onError={(e) => { e.target.src = movie.poster; }}
                  />
                  <div className="nc-hover-preview-gradient" />
                  <p className="nc-hover-preview-title">{movie.title}</p>
                </div>

                {/* Action buttons */}
                <div className="nc-hover-actions">
                  <button className="nc-btn nc-btn--play" onClick={(e) => { e.stopPropagation(); onMovieClick && onMovieClick(movie); }} title="Play">
                    <Play size={16} fill="black" color="black" />
                  </button>
                  <button className="nc-btn" title="Add to List">
                    <Plus size={18} />
                  </button>
                  <button className="nc-btn" title="Like">
                    <ThumbsUp size={16} />
                  </button>
                  <div style={{ flex: 1 }} />
                  <button className="nc-btn" title="More Info" onClick={(e) => { e.stopPropagation(); onMovieClick && onMovieClick(movie); }}>
                    <Info size={18} />
                  </button>
                </div>

                {/* Meta info */}
                <div className="nc-hover-meta">
                  <span className="nc-match">{Math.round((movie.rating || 7) * 10)}% Match</span>
                  <span className="nc-year">{movie.year || movie.releaseYear || '2024'}</span>
                  <span className="nc-rating-badge">U/A</span>
                </div>

                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="nc-hover-genres">
                    {movie.genres.slice(0, 3).map((g, i) => (
                      <React.Fragment key={g}>
                        <span>{g}</span>
                        {i < Math.min(movie.genres.length, 3) - 1 && <span className="nc-dot">•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Overview */}
                {movie.description && (
                  <p className="nc-hover-overview">{movie.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button className="carousel-arrow right" onClick={() => scroll('right')} aria-label="Scroll right">
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
};

export default MovieCarousel;

