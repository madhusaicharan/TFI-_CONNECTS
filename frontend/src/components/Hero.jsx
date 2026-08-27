import React from 'react';
import { CoverFlowCarousel } from '@/components/ui/3-d-coverflow-carousel';
import './Hero.css';

const Hero = ({ movies }) => {
  if (!movies || movies.length === 0) {
    return (
      <div id="hero-section" className="netflix-hero loading">
        <div className="w-full h-[75vh] bg-black/80 flex items-center justify-center text-gray-500">
          <div className="animate-pulse font-medium">Loading Hero Carousel...</div>
        </div>
      </div>
    );
  }

  return (
    <div id="hero-section" className="w-full relative">
      <CoverFlowCarousel items={movies} movies={movies} autoplayDelay={8000} />
    </div>
  );
};

export default Hero;

