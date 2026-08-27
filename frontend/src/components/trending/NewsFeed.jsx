import React from 'react';
import './NewsFeed.css';

const NewsFeed = ({ news }) => {
  if (!news || news.length === 0) return <p className="no-data">No recent news found.</p>;

  return (
    <div className="news-feed">
      {news.map((item, index) => (
        <a key={item.id || index} href={item.link} target="_blank" rel="noopener noreferrer" className="news-card">
          <div className="news-content">
            <h3 className="news-title">{item.title}</h3>
            <p className="news-source">{item.source} • {new Date(item.publishedAt).toLocaleDateString()}</p>
          </div>
        </a>
      ))}
    </div>
  );
};

export default NewsFeed;
