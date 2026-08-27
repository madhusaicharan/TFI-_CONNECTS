import React from 'react';
import './BoxOffice.css';
import { IndianRupee, TrendingUp } from 'lucide-react';

const BoxOffice = ({ stats }) => {
  return (
    <div className="box-office-section">
      <div className="section-header">
        <h2 className="section-title">All Time Blockbusters</h2>
        <TrendingUp className="text-accent" />
      </div>
      
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.id} className="stat-card glass-panel">
            <div className="stat-card-header">
              <h3>{stat.title}</h3>
              <span className="status-badge">{stat.status}</span>
            </div>
            
            <div className="stat-details">
              <div className="stat-item">
                <span className="label">Collection</span>
                <span className="value collection">
                  <IndianRupee size={16} />
                  {stat.collection}
                </span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="label">Budget</span>
                <span className="value budget">
                  <IndianRupee size={16} />
                  {stat.budget}
                </span>
              </div>
            </div>
            
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '85%' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoxOffice;
