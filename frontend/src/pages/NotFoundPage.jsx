import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const codeRef = useRef(null);

  // Animate the "404" number counting up
  useEffect(() => {
    if (!codeRef.current) return;
    let frame;
    let start = null;
    const duration = 800;
    const target = 404;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      codeRef.current.textContent = Math.floor(eased * target);
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="not-found-page">
      {/* Background film grain overlay */}
      <div className="not-found-grain" aria-hidden="true" />

      <div className="not-found-content">
        {/* Animated film strip decoration */}
        <div className="film-strip" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="film-hole" />
          ))}
        </div>

        <div className="not-found-main">
          <p className="not-found-label">Error</p>
          <h1 className="not-found-code" ref={codeRef}>0</h1>
          <h2 className="not-found-title">Scene Not Found</h2>
          <p className="not-found-subtitle">
            The reel you're looking for has been cut from the final edit.
            <br />
            Let's get you back to the main feature.
          </p>

          <div className="not-found-actions">
            <Link to="/" className="nf-btn nf-btn-primary">
              ← Back to Home
            </Link>
            <Link to="/movies" className="nf-btn nf-btn-secondary">
              Browse Movies
            </Link>
            <Link to="/search" className="nf-btn nf-btn-ghost">
              Search
            </Link>
          </div>
        </div>

        {/* Bottom film strip */}
        <div className="film-strip film-strip-bottom" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="film-hole" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
