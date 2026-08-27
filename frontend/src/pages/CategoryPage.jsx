import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchMoviesByCategory } from '../services/api';
import { Play, Plus, ThumbsUp, Info, Search, Filter } from 'lucide-react';
import './CategoryPage.css';

const CATEGORY_NAMES = {
  'new-releases': { title: '🎬 New Releases', desc: 'Freshly released Telugu movies and premiering blockbusters' },
  'action': { title: '⚡ Action Blockbusters', desc: 'High-octane mass action, stunts, and adrenaline-pumping spectacles' },
  'award-winners': { title: '🏆 Award Winning Films', desc: 'National Award winners, Nandi Award recipients, and critical masterpieces' },
  'superhero': { title: '🦸 Heroes & Legends', desc: 'Iconic hero stories, star-studded blockbusters, and legendary sagas' },
  'comedy': { title: '😂 Laugh Out Loud Comedies', desc: 'Hilarious comedy entertainers, slapstick humor, and family fun' },
  'romance': { title: '💕 Romantic Tales', desc: 'Heartwarming love stories, romantic dramas, and musical melodies' },
  'crime': { title: '🔍 Crime & Dark Thrillers', desc: 'Intense crime investigations, gritty thrillers, and neo-noir stories' },
  'thriller': { title: '😱 Suspense & Thrillers', desc: 'Edge-of-your-seat suspense, plot twists, and psychological thrillers' },
  'scifi': { title: '🚀 Sci-Fi & Fictional', desc: 'Futuristic sci-fi epics, fantasy worlds, and speculative cinema' },
  'drama': { title: '🎭 Critically Acclaimed Dramas', desc: 'Deep emotional stories, character-driven sagas, and social dramas' },
  'family': { title: '👨‍👩‍👧 Family Entertainers', desc: 'Wholesome family cinema, festive blockbusters, and relatable stories' },
  'mythological': { title: '🌟 Mythological Epics', desc: 'Grand mythological spectacles, historical legends, and folklore' },
  'classics': { title: '🏛️ Ultra Classics of TFI', desc: 'Timeless Golden Era masterpieces that shaped Telugu cinema history' },
  'trending': { title: '🔥 Trending Now', desc: 'Top trending movies dominating social media and box office charts' },
  'top10': { title: '🔝 Top 10 Telugu Movies', desc: 'Highest rated and most watched Telugu movies right now' },
  'blockbusters': { title: '💥 Industry Blockbusters', desc: 'Record-breaking box office titans of Telugu cinema' },
};

const CategoryPage = () => {
  const { categoryKey } = useParams();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState(null);

  const categoryMeta = CATEGORY_NAMES[categoryKey] || {
    title: `🎬 ${categoryKey ? categoryKey.replace('-', ' ').toUpperCase() : 'Category'} Movies`,
    desc: 'Explore curated Tollywood movies in this category',
  };

  useEffect(() => {
    const loadCategoryMovies = async () => {
      setLoading(true);
      try {
        const data = await fetchMoviesByCategory(categoryKey);
        setMovies(data || []);
      } catch (err) {
        console.error('Failed to load category movies:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCategoryMovies();
    window.scrollTo(0, 0);
  }, [categoryKey]);

  const filteredMovies = movies.filter((m) =>
    (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.genres || []).some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleMovieClick = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  return (
    <div className="category-page">
      <Navbar />

      <div className="category-container">
        {/* Category Header */}
        <header className="category-header fade-in">
          <h1 className="category-title">{categoryMeta.title}</h1>
          <p className="category-desc">{categoryMeta.desc}</p>
          <div className="category-meta-bar">
            <span className="count-badge">{movies.length} Movies Available</span>
            
            {/* Search Input */}
            <div className="category-search-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search movies in this category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="category-search-input"
              />
            </div>
          </div>
        </header>

        {loading ? (
          <LoadingSpinner message="Loading Category Movies..." />
        ) : filteredMovies.length === 0 ? (
          <div className="empty-category">
            <p>No movies found for "{searchQuery}"</p>
          </div>
        ) : (
          /* Movie Cards Grid */
          <div className="category-grid">
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                className={`nc-card ${hoveredId === movie.id ? 'nc-card--hovered' : ''}`}
                onMouseEnter={() => setHoveredId(movie.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleMovieClick(movie)}
              >
                {/* Poster */}
                <div className="nc-poster-wrap">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="nc-poster-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=80';
                    }}
                  />
                  <div className="nc-poster-gradient" />
                </div>

                {/* Title below poster */}
                <p className="nc-card-title">{movie.title}</p>

                {/* Hover popup info panel */}
                <div className="nc-hover-panel">
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

                  <div className="nc-hover-actions">
                    <button className="nc-btn nc-btn--play" onClick={(e) => { e.stopPropagation(); handleMovieClick(movie); }}>
                      <Play size={16} fill="black" color="black" />
                    </button>
                    <button className="nc-btn" title="Add to List">
                      <Plus size={18} />
                    </button>
                    <button className="nc-btn" title="Like">
                      <ThumbsUp size={16} />
                    </button>
                    <div style={{ flex: 1 }} />
                    <button className="nc-btn" title="More Info" onClick={(e) => { e.stopPropagation(); handleMovieClick(movie); }}>
                      <Info size={18} />
                    </button>
                  </div>

                  <div className="nc-hover-meta">
                    <span className="nc-match">{Math.round((movie.rating || 7) * 10)}% Match</span>
                    <span className="nc-year">{movie.year || movie.releaseYear || '2024'}</span>
                    <span className="nc-rating-badge">U/A</span>
                  </div>

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

                  {movie.description && (
                    <p className="nc-hover-overview">{movie.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CategoryPage;
