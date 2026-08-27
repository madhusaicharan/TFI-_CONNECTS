import React from 'react';
import './LaunchHero.css';

const LaunchHero = () => {
  return (
    <div className="launch-hero-container">
      <div className="launch-hero-bg"></div>
      <div className="launch-hero-overlay"></div>
      
      <div className="launch-hero-content">
        <div className="launch-logo-container">
          <h1 className="cinematic-hero-logo">
            <span className="hero-text-tfi">TFI</span>
            <span className="hero-text-connects">_CONNECTS</span>
          </h1>
          <div className="hero-logo-glow"></div>
        </div>
        <div className="scroll-hint">
          <p>Scroll to Explore</p>
          <div className="mouse-wheel"></div>
        </div>
      </div>
    </div>
  );
};

export default LaunchHero;
