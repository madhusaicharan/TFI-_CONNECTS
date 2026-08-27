import React from 'react';
import { Clapperboard, Video, Sparkles } from 'lucide-react';
import './MovieSetLanding.css';

const MovieSetLanding = ({ onEnterUniverse }) => {
  const scrollToHero = () => {
    if (onEnterUniverse) {
      onEnterUniverse();
    }
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="movie-landing-container">
      {/* Dynamic Background Elements */}
      <div className="cinematic-bg"></div>
      <div className="spotlight spotlight-left"></div>
      <div className="spotlight spotlight-right"></div>
      <div className="smoke-overlay"></div>
      <div className="dust-particles"></div>

      <div className="landing-content">
        <div className="icon-group">
          <Video className="cinema-icon floating-icon-slow" size={48} />
          <Clapperboard className="cinema-icon main-icon" size={80} />
          <Sparkles className="cinema-icon floating-icon-fast" size={48} />
        </div>

        <div className="title-wrapper">
          <h1 className="landing-title">
            <span className="title-line">LIGHTS.</span>
            <span className="title-line">CAMERA.</span>
            <span className="title-line highlight">TOLLYWOOD.</span>
          </h1>
        </div>
        
        <p className="landing-subtitle">
          Step onto the set of the ultimate Telugu cinema experience.
        </p>
      </div>
    </div>
  );
};

export default MovieSetLanding;
