import React from 'react';
import { Flame, Star, ThumbsUp, Ticket, ExternalLink } from 'lucide-react';
import './MovieDemandCard.css';

const MovieDemandCard = ({ movie, onMovieClick }) => {
  const bookingStatus = movie.bookingStatus || 'FILLING FAST';
  const statusClass = bookingStatus.replace(/\s+/g, '-').toLowerCase();

  // Extract display tag (e.g. "1.5M+ Likes", "208K+ Likes", or "7.7/10  1.2K+ Votes")
  const displayTag = movie.bmsDisplayTag || (movie.votesCount ? `⭐ ${movie.rating}/10 (${movie.votesCount})` : `⭐ ${movie.rating}/10`);
  const isLikes = displayTag.toLowerCase().includes('like');

  return (
    <div className="bms-movie-card fade-in">
      {/* Poster Container with 2:3 Aspect Ratio */}
      <div className="bms-poster-container" onClick={() => onMovieClick(movie)}>
        <img
          src={movie.poster}
          alt={movie.title}
          className="bms-poster"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=80';
          }}
        />

        {/* Top Status Tag */}
        <div className={`bms-status-badge ${statusClass}`}>
          {bookingStatus === 'FILLING FAST' && <Flame size={12} fill="white" />}
          {bookingStatus}
        </div>

        {/* Full-width BookMyShow Likes / Rating Bar at Bottom of Poster */}
        <div className="bms-poster-bottom-bar">
          {isLikes ? (
            <ThumbsUp size={15} fill="#ff4d4d" color="#ff4d4d" />
          ) : (
            <Star size={15} fill="#ffd700" color="#ffd700" />
          )}
          <span className="bms-bottom-tag-text">{displayTag}</span>
        </div>
      </div>

      {/* Card Info Content */}
      <div className="bms-card-info">
        <h3 className="bms-movie-title" onClick={() => onMovieClick(movie)}>
          {movie.title}
        </h3>

        {/* Formats Pills */}
        <div className="bms-format-pills">
          {(movie.formats || ['2D', '3D', 'IMAX 3D', '4K Dolby Atmos']).map((f, i) => (
            <span key={i} className="format-pill">{f}</span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="bms-actions">
          <button
            className="bms-book-btn bms-red"
            onClick={() => window.open(movie.bmsUrl || 'https://in.bookmyshow.com/explore/movies-hyderabad', '_blank')}
          >
            <Ticket size={16} /> Book on BookMyShow
          </button>

          <button
            className="bms-book-btn district-blue"
            onClick={() => window.open('https://www.district.in', '_blank')}
          >
            <ExternalLink size={16} /> Book on District App
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieDemandCard;
