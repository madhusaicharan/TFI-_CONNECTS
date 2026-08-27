import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchBoxOfficeStats, fetchAllTimeBlockbusters } from '../services/api';
import { Trophy, TrendingUp, DollarSign } from 'lucide-react';
import './RecordsPage.css';

const RecordsPage = () => {
  const [stats, setStats] = useState([]);
  const [blockbusters, setBlockbusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bo, bb] = await Promise.all([
          fetchBoxOfficeStats(),
          fetchAllTimeBlockbusters()
        ]);
        setStats(bo);
        setBlockbusters(bb);
      } catch (err) {
        console.error('Failed to load records:', err);
        setError('Failed to load collection records.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="records-page">
        <Navbar />
        <LoadingSpinner message="Loading records..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="records-page">
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <p style={{ color: '#888', fontSize: '1.1rem' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ background: '#e50914', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="records-page">
      <Navbar />
      
      <div className="records-container fade-in">
        <div className="records-header">
          <Trophy size={60} color="#e50914" className="trophy-icon" />
          <h1 className="records-title">All Time <span>Collection Records</span></h1>
          <p className="records-subtitle">The highest grossing Tollywood phenomenons that shook the global box office.</p>
        </div>

        <div className="records-grid">
          {stats.map((stat, index) => {
            const movie = blockbusters.find(b => b.title === stat.title) || blockbusters[index % (blockbusters.length || 1)];
            return (
              <div key={stat.id || index} className="record-card glass-panel">
                <div className="record-rank">#{index + 1}</div>
                {movie && <img src={movie.poster} alt={stat.title} className="record-poster" />}
                <div className="record-details">
                  <h2 className="record-movie-title">{stat.title}</h2>
                  <div className="record-status">
                    <span className="status-badge">{stat.status}</span>
                  </div>
                  
                  <div className="stats-row">
                    <div className="stat-item">
                      <DollarSign size={20} color="#4ade80" />
                      <div className="stat-info">
                        <span className="stat-label">Worldwide Gross</span>
                        <span className="stat-value collection">{stat.collection}</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <TrendingUp size={20} color="#60a5fa" />
                      <div className="stat-info">
                        <span className="stat-label">Budget</span>
                        <span className="stat-value">{stat.budget}</span>
                      </div>
                    </div>
                  </div>

                  <div className="progress-container">
                    <div className="progress-header">
                      <span>Profit Recovery</span>
                      <span>{stat.percent}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${Math.min(stat.percent, 100)}%`, background: stat.percent >= 90 ? '#e50914' : '#4ade80' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RecordsPage;
