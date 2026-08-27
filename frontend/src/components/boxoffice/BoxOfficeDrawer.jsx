import React, { useEffect, useState } from 'react';
import { X, Flame, Ticket, Star, TrendingUp, CheckCircle, ExternalLink, MapPin } from 'lucide-react';
import HourlyVelocityChart from './HourlyVelocityChart';
import { fetchMovieTrends } from '../../services/api';
import './BoxOfficeDrawer.css';

const BoxOfficeDrawer = ({ movie, onClose }) => {
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!movie) return;
    const loadTrends = async () => {
      setLoading(true);
      try {
        const res = await fetchMovieTrends(movie.id);
        setTrendData(res || movie);
      } catch (err) {
        console.error('Failed to load trends:', err);
        setTrendData(movie);
      } finally {
        setLoading(false);
      }
    };
    loadTrends();
  }, [movie]);

  if (!movie) return null;

  const data = trendData || movie;
  const bmsShare = data.bms_share || 60;
  const districtShare = data.district_share || (100 - bmsShare);
  const cityOcc = data.city_occupancy || {
    Hyderabad: 96,
    Vizag: 94,
    Vijayawada: 91,
    Tirupati: 88,
    Bengaluru: 86,
    Mumbai: 81
  };
  const heatmap = data.showtime_heatmap || {
    Morning: 82,
    Matinee: 96,
    FirstShow: 98,
    SecondShow: 94
  };

  return (
    <div className="bms-drawer-overlay fade-in" onClick={onClose}>
      <div className="bms-drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="drawer-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-poster-wrap">
            <img src={movie.poster} alt={movie.title} className="drawer-poster-img" />
          </div>

          <div className="drawer-header-info">
            <div className="drawer-badge-row">
              <span className="drawer-live-tag">
                <span className="live-pulse-dot" /> REAL-TIME DEMAND
              </span>
              <span className="drawer-rating-tag">
                <Star size={14} fill="#ffd700" color="#ffd700" /> {movie.rating}/10 ({movie.votesCount})
              </span>
            </div>

            <h2 className="drawer-movie-title">{movie.title}</h2>

            <p className="drawer-meta-line">
              <span className="meta-pill">{movie.releaseYear || '2025'}</span>
              <span className="meta-pill">{movie.cert || 'U/A'}</span>
              <span className="meta-pill">{movie.language}</span>
            </p>

            <div className="drawer-velocity-banner">
              <Flame size={18} fill="#ff4d4d" color="#ff4d4d" />
              <span>
                <strong>{(movie.last_hour_ticket_count || 12500).toLocaleString()} tickets</strong> booked in the last 1 hr
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="drawer-body">
          {/* Section 1: Platform Split (BMS vs District) */}
          <div className="drawer-section">
            <h3 className="section-title">📊 Platform Booking Split (BookMyShow vs District)</h3>
            <div className="platform-split-bar-wrap">
              <div className="split-labels">
                <span className="split-lbl bms">BookMyShow ({bmsShare}%)</span>
                <span className="split-lbl district">District App ({districtShare}%)</span>
              </div>
              <div className="split-progress-track">
                <div className="split-progress-bms" style={{ width: `${bmsShare}%` }} />
                <div className="split-progress-district" style={{ width: `${districtShare}%` }} />
              </div>
            </div>
          </div>

          {/* Section 2: Hourly Velocity Chart */}
          <div className="drawer-section">
            <HourlyVelocityChart trendData={data.hourly_trend} />
          </div>

          {/* Section 3: Showtime Occupancy Heatmap */}
          <div className="drawer-section">
            <h3 className="section-title">🔥 Showtimes Occupancy Heatmap</h3>
            <div className="heatmap-grid">
              {Object.entries(heatmap).map(([slot, occ]) => (
                <div key={slot} className="heatmap-slot-card">
                  <span className="slot-name">{slot === 'FirstShow' ? 'First Show' : slot === 'SecondShow' ? 'Second Show' : slot}</span>
                  <div className="slot-occ-val" style={{ color: occ >= 90 ? '#ff4d4d' : occ >= 80 ? '#f59e0b' : '#10b981' }}>
                    {occ}% Occupied
                  </div>
                  <div className="slot-progress">
                    <div
                      className="slot-fill"
                      style={{
                        width: `${occ}%`,
                        background: occ >= 90 ? '#e50914' : occ >= 80 ? '#f59e0b' : '#10b981'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Regional City Breakdown */}
          <div className="drawer-section">
            <h3 className="section-title">📍 City-wise Occupancy Breakdown</h3>
            <div className="city-table">
              {Object.entries(cityOcc).map(([cName, occ]) => (
                <div key={cName} className="city-row">
                  <div className="city-name-cell">
                    <MapPin size={14} color="#e50914" />
                    <span>{cName}</span>
                  </div>
                  <div className="city-status-cell">
                    <span className={`occ-badge ${occ >= 90 ? 'high' : 'med'}`}>{occ}% Occupancy</span>
                    <span className="city-fast-text">{occ >= 90 ? 'Fast Filling' : 'Filling Steady'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="drawer-footer-actions">
          <button
            className="drawer-book-btn bms-red"
            onClick={() => window.open(movie.bmsUrl || 'https://in.bookmyshow.com/explore/movies-hyderabad', '_blank')}
          >
            <Ticket size={18} /> Book on BookMyShow
          </button>
          <button
            className="drawer-book-btn district-blue"
            onClick={() => window.open('https://www.district.in', '_blank')}
          >
            <ExternalLink size={18} /> Book on District App
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoxOfficeDrawer;
