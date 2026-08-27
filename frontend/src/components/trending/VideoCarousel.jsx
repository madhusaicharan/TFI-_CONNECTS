import React from 'react';
import { Play } from 'lucide-react';
import './VideoCarousel.css';

const VideoCarousel = ({ videos, title }) => {
  if (!videos || videos.length === 0) return null;

  return (
    <div className="video-section">
      <h3 className="video-section-title">{title}</h3>
      <div className="video-carousel-container">
        {videos.map((video) => (
          <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" className="video-card">
            <div className="video-thumbnail">
              <img src={video.thumbnail} alt={video.title} />
              <div className="video-play-overlay">
                <Play fill="white" size={32} />
              </div>
              <span className="video-duration">{video.duration}</span>
            </div>
            <div className="video-info">
              <h4 className="video-title" title={video.title}>{video.title}</h4>
              <p className="video-meta">{video.author} • {video.views} views</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default VideoCarousel;
