import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { searchMoviesDebounced } from '../services/api';
import { Search, X } from 'lucide-react';
import './Search.css';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    searchMoviesDebounced(query, (movies) => {
      setResults(movies);
      setLoading(false);
    });
  }, [query]);

  return (
    <div className="search-page">
      <Navbar />
      <div className="search-container">
        <div className="search-input-wrapper">
          <Search size={22} className="search-input-icon" />
          <input
            type="text"
            placeholder="Search for a movie, actor, director..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              <X size={18} />
            </button>
          )}
        </div>

        {query && !loading && <p className="search-results-text">Results for "{query}"</p>}
        {loading && <p className="search-results-text" style={{ color: '#666' }}>Searching...</p>}

        <div className="results-grid">
          {results.map(movie => (
            <div key={movie.id} className="result-card" onClick={() => navigate(`/movie/${movie.id}`)}>
              <img src={movie.poster} alt={movie.title} />
              <div className="result-overlay">
                <p>{movie.title}</p>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && query && !loading && (
          <div className="no-results">
            <h3>No results found for "{query}"</h3>
            <p>Try searching for a different movie title.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
