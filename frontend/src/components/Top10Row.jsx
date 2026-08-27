import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Top10Row.css';

const Top10Row = ({ title = "Trending Now", movies = [] }) => {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (trackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      setShowLeftArrow(scrollLeft > 10);
      const isScrollable = scrollWidth > clientWidth + 5;
      setShowRightArrow(isScrollable && scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (trackRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollWidth > clientWidth + 5 || movies.length > 5);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [movies]);

  const scroll = (direction) => {
    if (!trackRef.current) return;
    const scrollAmount = trackRef.current.clientWidth * 0.75;
    trackRef.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="top10-section">
      {/* Top arch curved gradient line */}
      <div className="top10-arch-container">
        <svg viewBox="0 0 1440 60" className="top10-arch-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="top10-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4a001a" stopOpacity="0.7" />
              <stop offset="45%" stopColor="#c8084b" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#e50914" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#4a001a" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path d="M0,55 Q720,5 1440,55" stroke="url(#top10-arc-grad)" strokeWidth="2.5" fill="none" />
        </svg>
        <div className="top10-arch-glow" />
      </div>

      <h2 className="top10-header-title">{title}</h2>

      <div className="top10-carousel-container">
        {showLeftArrow && (
          <button className="top10-pill-arrow left" onClick={() => scroll('left')} aria-label="Scroll left">
            <ChevronLeft size={24} color="#ffffff" />
          </button>
        )}

        <div className="top10-track" ref={trackRef} onScroll={handleScroll}>
          {movies.map((movie, index) => (
            <div
              key={movie.id || index}
              className="top10-card"
              onClick={() => navigate(`/movie/${movie.id}`)}
            >
              <div className="top10-poster-wrapper">
                <img
                  className="top10-poster"
                  src={movie.poster}
                  alt={movie.title}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=80';
                  }}
                />
              </div>
              <div className={`top10-number-overlay ${index + 1 >= 10 ? 'multi-digit' : ''}`}>
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {showRightArrow && (
          <button className="top10-pill-arrow right" onClick={() => scroll('right')} aria-label="Scroll right">
            <ChevronRight size={24} color="#ffffff" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Top10Row;

