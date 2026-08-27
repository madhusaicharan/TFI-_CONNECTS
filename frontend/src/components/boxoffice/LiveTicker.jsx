import React from 'react';
import { Flame, Ticket, MapPin, Clock, Zap, TrendingUp } from 'lucide-react';
import './LiveTicker.css';

const LiveTicker = ({
  tickerData,
  cities = [],
  selectedCity = 'All',
  onCityChange,
  lastUpdated
}) => {
  const totalTickets = tickerData?.totalTicketsLastHour
    ? (tickerData.totalTicketsLastHour / 1000).toFixed(1) + 'K'
    : '42.8K';

  const topMovie = tickerData?.topTrendingMovie || 'Pushpa 2: The Rule';

  return (
    <div className="live-ticker-banner fade-in">
      <div className="live-ticker-top">
        <div className="live-status-pill">
          <span className="live-pulse-dot" />
          <span className="live-pill-text">LIVE THEATRICAL FEED</span>
          <span className="live-pill-sep">•</span>
          <span className="live-time-text">
            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
            BookMyShow & District Aggregation
          </span>
        </div>

        <div className="city-selector-wrap">
          <MapPin size={16} className="city-pin-icon" />
          <select
            className="city-select-dropdown"
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
          >
            <option value="All">All India (Nationwide)</option>
            <option value="Hyderabad">Hyderabad (TFI Hub - 96% Occ)</option>
            <option value="Vizag">Vizag (Coastal AP - 94% Occ)</option>
            <option value="Vijayawada">Vijayawada (92% Occ)</option>
            <option value="Tirupati">Tirupati (89% Occ)</option>
            <option value="Bengaluru">Bengaluru (88% Occ)</option>
            <option value="Chennai">Chennai (84% Occ)</option>
            <option value="Mumbai">Mumbai (81% Occ)</option>
          </select>
        </div>
      </div>

      <div className="live-ticker-metrics">
        <div className="ticker-metric-card highlight">
          <div className="metric-icon-wrap red-glow">
            <Flame size={22} fill="#ff333d" color="#ff333d" />
          </div>
          <div className="metric-content">
            <span className="metric-label">TICKETS BOOKED (LAST 1 HR)</span>
            <div className="metric-value-row">
              <span className="metric-value">{totalTickets}</span>
              <span className="metric-sub">tickets / hour</span>
            </div>
          </div>
        </div>

        <div className="ticker-metric-card">
          <div className="metric-icon-wrap amber-glow">
            <Zap size={22} fill="#f59e0b" color="#f59e0b" />
          </div>
          <div className="metric-content">
            <span className="metric-label">#1 VELOCITY TRENDING</span>
            <div className="metric-value-row">
              <span className="metric-value-text">{topMovie}</span>
            </div>
          </div>
        </div>

        <div className="ticker-metric-card">
          <div className="metric-icon-wrap blue-glow">
            <Ticket size={22} color="#3b82f6" />
          </div>
          <div className="metric-content">
            <span className="metric-label">ACTIVE THEATRE SCREENS</span>
            <div className="metric-value-row">
              <span className="metric-value">{tickerData?.totalScreensTracked || '14,500+'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTicker;
