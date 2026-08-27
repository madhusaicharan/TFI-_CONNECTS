import React, { useState, useEffect, useCallback } from 'react';
import { ImageStreamHero } from '@/components/ui/image-stream-hero';
import './LandingPage.css';

const TMDB = 'https://image.tmdb.org/t/p/w500';

const IMAGES = [
  // Telugu Blockbuster Hero Movie Posters
  { src: `${TMDB}/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg`, alt: 'Kalki 2898 AD - Prabhas' },
  { src: `${TMDB}/u0XUBNQWlOvrh0Gd97ARGpIkL0.jpg`, alt: 'RRR - Ram Charan & Jr NTR' },
  { src: `${TMDB}/7HeMz4qskfnoHeZxp6oV4xCjqZs.jpg`, alt: 'Pushpa 2: The Rule - Allu Arjun' },
  { src: `${TMDB}/nlu9WbcetNFRGXXPWITr30ob7W6.jpg`, alt: 'Salaar: Ceasefire - Prabhas' },
  { src: `${TMDB}/lQfuaXjANoTsdx5iS0gCXlK9D2L.jpg`, alt: 'Devara: Part 1 - Jr NTR' },
  { src: `${TMDB}/21sC2assImQIYCEDA84Qh9d1RsK.jpg`, alt: 'Baahubali 2 - Prabhas' },
  { src: `${TMDB}/m1zq48rWSXxplzoJR8YtbXWnnHM.jpg`, alt: 'HanuMan - Teja Sajja' },
  { src: `${TMDB}/50cWZdbrmptTRKCAIfx7lSTj12z.jpg`, alt: 'Ala Vaikunthapurramuloo - Allu Arjun' },
  { src: `${TMDB}/xK7MEV56GF291VG0U5XnVJuvNv3.jpg`, alt: 'Magadheera - Ram Charan' },
  { src: `${TMDB}/kHubDgL59I5hCn7ccBYvU7bKY1r.jpg`, alt: 'Arjun Reddy - Vijay Deverakonda' },
  { src: `${TMDB}/kKDnGklCDRK8hrFGH4pLr7ZDA33.jpg`, alt: 'Pushpa: The Rise - Allu Arjun' },
  { src: `${TMDB}/9BAjt8nSSms62uOVYn1t3C3dVto.jpg`, alt: 'Baahubali: The Beginning - Prabhas' },
];

const LandingPage = ({ onComplete }) => {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // Show overlay content after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setOverlayVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = useCallback(() => {
    setFadingOut(true);
    setTimeout(() => onComplete(), 500);
  }, [onComplete]);

  return (
    <div className={`landing-page ${fadingOut ? 'landing-fade-out' : ''}`}>
      {/* Cinema Theatre Background Image */}
      <div className="landing-bg-cinema" />

      <ImageStreamHero
        images={IMAGES}
        speed={16}
        cards={9}
        axis={46}
        className="landing-hero-stream"
      >
        {/* Dark vignette overlay for readability */}
        <div className="landing-vignette" />

        {/* Branded content — logo pushed up, button pushed down */}
        <div className={`landing-overlay ${overlayVisible ? 'visible' : ''}`}>
          <div className="landing-logo-wrap">
            <h1 className="landing-logo">
              <span className="text-tfi">TFI</span>
              <span className="text-connects">_CONNECTS</span>
            </h1>
            <div className="landing-logo-glow" />
          </div>

          <div className="landing-spacer" />

          <button className="enter-btn" onClick={handleEnter}>
            Enter
          </button>
        </div>
      </ImageStreamHero>
    </div>
  );
};

export default LandingPage;
