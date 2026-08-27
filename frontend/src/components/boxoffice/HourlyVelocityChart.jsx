import React from 'react';
import './HourlyVelocityChart.css';

const HourlyVelocityChart = ({ trendData = [] }) => {
  if (!trendData || trendData.length === 0) return null;

  const maxTickets = Math.max(...trendData.map(t => t.tickets), 1);

  return (
    <div className="hourly-chart-container">
      <div className="chart-header">
        <span className="chart-title">📈 24-Hour Booking Velocity Trend (Tickets / Hour)</span>
        <span className="chart-peak">Peak: {(maxTickets / 1000).toFixed(1)}K tickets/hr</span>
      </div>

      <div className="chart-bars-wrap">
        {trendData.map((item, idx) => {
          const heightPercent = Math.round((item.tickets / maxTickets) * 100);
          const isPeak = item.tickets === maxTickets;

          return (
            <div key={idx} className="chart-bar-col" title={`${item.hour}: ${item.tickets.toLocaleString()} tickets`}>
              <div className="bar-val-label">{item.tickets > 1000 ? `${(item.tickets / 1000).toFixed(1)}K` : item.tickets}</div>
              <div className="bar-track">
                <div
                  className={`bar-fill ${isPeak ? 'peak-fill' : ''}`}
                  style={{ height: `${Math.max(12, heightPercent)}%` }}
                />
              </div>
              <div className="bar-time-label">{item.hour}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HourlyVelocityChart;
