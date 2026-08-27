import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BoxOfficeBuzz.css';

const BoxOfficeBuzz = ({ buzzMovies }) => {
  const navigate = useNavigate();

  if (!buzzMovies || buzzMovies.length === 0) return null;

  return (
    <div className="buzz-container">
      {buzzMovies.map((movie, index) => (
        <div key={movie.id} className="buzz-card" onClick={() => navigate(`/movie/${movie.id}`)}>
          <div className="buzz-rank">#{index + 1}</div>
          <img src={movie.poster} alt={movie.title} className="buzz-poster" />
          <div className="buzz-info">
            <h4 className="buzz-title">{movie.title}</h4>
            <div className="buzz-stats">
              <span className="buzz-rating">⭐ {movie.rating.toFixed(1)}</span>
              <span className="buzz-popularity">🔥 {Math.round(movie.popularity)} Buzz Score</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BoxOfficeBuzz;
