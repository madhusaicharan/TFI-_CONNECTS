import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import MovieDemandCard from '../components/boxoffice/MovieDemandCard';
import BoxOfficeDrawer from '../components/boxoffice/BoxOfficeDrawer';
import { fetchLiveBoxOffice } from '../services/api';
import { MapPin, ChevronDown, LayoutGrid, List, RefreshCw, Clock, Radio, AlertTriangle } from 'lucide-react';
import './BoxOfficePage.css';

const BoxOfficePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Hyderabad');
  const [selectedLanguage, setSelectedLanguage] = useState('Telugu');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMovieForDrawer, setSelectedMovieForDrawer] = useState(null);
  const [countdown, setCountdown] = useState(60);

  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Load live scraped data from backend
  const loadData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetchLiveBoxOffice({
        city: selectedCity.toLowerCase(),
        language: selectedLanguage.toLowerCase(),
        refresh: forceRefresh ? 'true' : 'false'
      });
      setData(res);
      setCountdown(60);
    } catch (err) {
      console.error('Live scrape API error:', err.message);
      setError(err.message || '502 Bad Gateway - Upstream Cinema Portal Scrape Blocked');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity, selectedLanguage]);

  // Initial load on mount and city/language change
  useEffect(() => {
    loadData(false);
    window.scrollTo(0, 0);
  }, [loadData]);

  // Live Refresh Countdown Timer (every 60s auto re-fetch)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadData(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loadData]);

  const movies = data?.movies || [];

  const handleManualRefresh = () => {
    loadData(true);
  };

  const handleMovieClick = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  const handleOpenDrawer = (movie) => {
    setSelectedMovieForDrawer(movie);
  };

  const handleCloseDrawer = () => {
    setSelectedMovieForDrawer(null);
  };

  // Format scrapedAt timestamp to HH:mm:ss
  const formattedTimestamp = data?.scrapedAt
    ? new Date(data.scrapedAt).toLocaleTimeString()
    : new Date().toLocaleTimeString();

  return (
    <div className="bms-explore-page">
      <Navbar />

      <div className="bms-explore-container fade-in">
        {/* Top Header & Live Indicators */}
        <div className="bms-top-header">
          <div className="bms-city-title-row">
            <div>
              <div className="live-status-pill-header">
                <Radio size={14} className="live-radio-icon" />
                <span className="live-pill-tag">LIVE CINEMA SCRAPE</span>
                <span className="live-pill-dot">•</span>
                <span className="live-timestamp">Live as of {formattedTimestamp}</span>
              </div>
              <h1 className="bms-main-title">
                Now Showing in <span className="highlight-city">{selectedCity}</span>
              </h1>
              <p className="bms-sub-title">
                Live theatrical listings & booking activity directly extracted via stealth sessions from BookMyShow & District
              </p>
            </div>

            <div className="bms-header-right-tools">
              {/* Location Picker */}
              <div className="bms-location-picker">
                <MapPin size={18} className="pin-icon" />
                <select
                  className="city-select"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Vizag">Vizag</option>
                  <option value="Vijayawada">Vijayawada</option>
                  <option value="Tirupati">Tirupati</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Mumbai">Mumbai</option>
                </select>
                <ChevronDown size={16} className="arrow-icon" />
              </div>

              {/* Language Selector */}
              <div className="bms-location-picker lang-picker">
                <select
                  className="city-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <option value="Telugu">Telugu</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Kannada">Kannada</option>
                </select>
                <ChevronDown size={16} className="arrow-icon" />
              </div>

              {/* View Toggle */}
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Live Refresh Control & Timer Bar */}
          <div className="live-refresh-control-bar">
            <div className="refresh-status-text">
              <Clock size={15} color="#ff333d" />
              <span>Updating live feeds every 60s (Next update in <strong>{countdown}s</strong>)</span>
            </div>

            <button
              className={`fetch-live-btn ${refreshing ? 'spinning' : ''}`}
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
            >
              <RefreshCw size={15} className={refreshing ? 'spin-icon' : ''} />
              <span>{refreshing ? 'Scraping Live Feeds...' : '🔄 Fetch Live Data'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <LoadingSpinner message={`Executing Stealth Puppeteer Scrape for ${selectedCity} (${selectedLanguage})...`} />
        ) : error ? (
          <div className="bms-error-box fade-in">
            <AlertTriangle size={42} color="#ff4d4d" style={{ marginBottom: 12 }} />
            <h3 className="error-heading">502 Bad Gateway</h3>
            <p className="error-msg">{error}</p>
            <p className="error-sub">Zero Mock Policy Active: Fallback fixtures are disabled. The upstream cinema portal is currently blocking or rate-limiting incoming sessions.</p>
            <button className="retry-btn" onClick={() => loadData(true)}>
              🔄 Re-Try Live Stealth Session
            </button>
          </div>
        ) : movies.length === 0 ? (
          <div className="bms-empty-box">
            <h3>No running theatrical movies found on BookMyShow for {selectedCity}.</h3>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'bms-grid' : 'bms-list'}>
            {movies.map((movie) => (
              <MovieDemandCard
                key={movie.id}
                movie={movie}
                onMovieClick={handleMovieClick}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BoxOfficePage;
