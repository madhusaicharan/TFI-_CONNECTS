import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    // Call onComplete after 3 seconds (allowing 0.5s for fade out animation)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${isFadingOut ? 'fade-out' : 'fade-in'}`}>
      <div className="splash-bg"></div>
      <div className="splash-overlay"></div>
      <div className="logo-container">
        <h1 className="cinematic-logo">
          <span className="text-tfi">TFI</span>
          <span className="text-connects">_CONNECTS</span>
        </h1>
        <div className="logo-glow"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
