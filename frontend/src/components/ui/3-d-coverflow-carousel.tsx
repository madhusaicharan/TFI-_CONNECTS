import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface CarouselItem {
  id: string | number;
  title: string;
  match?: number | string;
  year?: number | string;
  rating?: string;
  duration?: string;
  quality?: string;
  overview?: string;
  bgImage?: string;
  poster?: string;
  trailerUrl?: string;
}

export interface CoverFlowCarouselProps {
  items?: CarouselItem[];
  movies?: CarouselItem[];
  autoplay?: boolean;
  autoplayDelay?: number;
  onMovieClick?: (item: CarouselItem) => void;
  className?: string;
}

export function CoverFlowCarousel({
  items,
  movies,
  autoplay = true,
  autoplayDelay = 8000,
  onMovieClick,
  className = '',
}: CoverFlowCarouselProps) {
  const movieList = items || movies || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [spacing, setSpacing] = useState(300);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-flex card spacing according to screen width
  useEffect(() => {
    const updateSpacing = () => {
      const w = window.innerWidth;
      if (w < 640) setSpacing(155);
      else if (w < 1024) setSpacing(230);
      else if (w < 1440) setSpacing(300);
      else if (w < 1920) setSpacing(360);
      else setSpacing(420);
    };

    updateSpacing();
    window.addEventListener('resize', updateSpacing);
    return () => window.removeEventListener('resize', updateSpacing);
  }, []);

  // Clamp index safely if list changes
  useEffect(() => {
    if (movieList.length > 0 && currentIndex >= movieList.length) {
      setCurrentIndex(0);
    }
  }, [movieList, currentIndex]);

  // Autoplay rotation (8000ms default, paused when hovered)
  useEffect(() => {
    if (!autoplay || movieList.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movieList.length);
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [autoplay, autoplayDelay, movieList.length, isHovered]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (movieList.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + movieList.length) % movieList.length);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % movieList.length);
      }
    },
    [movieList.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!movieList || movieList.length === 0) {
    return (
      <div className="w-full h-[75vh] flex items-center justify-center bg-black text-gray-500">
        <div className="animate-pulse font-medium">Loading Coverflow Carousel...</div>
      </div>
    );
  }

  const currentMovie = movieList[currentIndex] || movieList[0];

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % movieList.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + movieList.length) % movieList.length);
  };

  const handleSelectCard = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(index);
  };

  const handleCardClick = (item: CarouselItem, index: number, e: React.MouseEvent) => {
    if (index !== currentIndex) {
      handleSelectCard(index, e);
    } else {
      if (onMovieClick) {
        onMovieClick(item);
      } else if (item.id) {
        navigate(`/movie/${item.id}`);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-[85vh] sm:min-h-[90vh] md:min-h-[93vh] overflow-hidden bg-black text-white flex flex-col justify-between pt-16 pb-4 select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Ambience / Active Movie Image filling entire website background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMovie.id || currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="fixed inset-0"
            style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', willChange: 'opacity, transform' }}
          >
            <img
              src={currentMovie.bgImage || currentMovie.poster}
              alt={currentMovie.title}
              className="w-full h-full object-cover filter blur-lg brightness-[0.35] scale-110"
              style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/30 to-black/85" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Full-width 3D Coverflow Stage */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center my-auto px-2 sm:px-6">
        <div className="relative w-full h-[400px] sm:h-[480px] md:h-[540px] lg:h-[580px] flex items-center justify-center perspective-[1200px] overflow-visible">
          {movieList.map((movie, index) => {
            let offset = index - currentIndex;
            if (offset < -Math.floor(movieList.length / 2)) {
              offset += movieList.length;
            } else if (offset > Math.floor(movieList.length / 2)) {
              offset -= movieList.length;
            }

            const isCenter = offset === 0;
            const isVisible = Math.abs(offset) <= 3;

            if (!isVisible) return null;

            // Calculate 3D transforms
            const rotateY = offset * -30;
            const translateX = offset * spacing;
            const scale = isCenter ? 1 : Math.max(0.62, 1 - Math.abs(offset) * 0.16);
            const zIndex = 40 - Math.abs(offset) * 10;
            const opacity = isCenter ? 1 : Math.max(0.35, 1 - Math.abs(offset) * 0.28);

            return (
              <motion.div
                key={movie.id || index}
                onClick={(e) => handleCardClick(movie, index, e)}
                initial={false}
                animate={{
                  x: translateX,
                  scale: scale,
                  rotateY: rotateY,
                  zIndex: zIndex,
                  opacity: opacity,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 24,
                }}
                style={{
                  transformStyle: 'preserve-3d',
                }}
                className={`absolute w-[190px] sm:w-[250px] md:w-[310px] lg:w-[350px] aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer shadow-2xl transition-shadow duration-300 border ${
                  isCenter
                    ? 'border-red-600/90 shadow-[0_20px_60px_rgba(229,9,20,0.6)] scale-105'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <img
                  src={movie.poster || movie.bgImage}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=80';
                  }}
                />

                {/* Subtle gradient vignette overlay on card */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-90" />

                {/* Title & Match Badge on active / hovered card */}
                <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none z-20">
                  <p className="text-base sm:text-xl md:text-2xl font-black truncate drop-shadow-xl tracking-tight text-white">
                    {movie.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {movie.match && (
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-400 drop-shadow-md">
                        {movie.match}% Match
                      </span>
                    )}
                    {movie.quality && (
                      <span className="text-[10px] font-bold text-gray-300 border border-white/30 px-1.5 py-0.5 rounded">
                        {movie.quality}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          aria-label="Previous Movie"
          className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3.5 sm:p-4 rounded-full bg-black/60 hover:bg-red-600/90 text-white backdrop-blur-md border border-white/15 transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl"
        >
          <ChevronLeft size={32} />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next Movie"
          className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3.5 sm:p-4 rounded-full bg-black/60 hover:bg-red-600/90 text-white backdrop-blur-md border border-white/15 transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Pagination Indicators */}
      <div className="relative z-20 flex justify-center items-center gap-2.5 mt-2 mb-1">
        {movieList.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => handleSelectCard(idx, e)}
            aria-label={`Go to movie slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIndex ? 'w-10 bg-red-600 shadow-md' : 'w-2.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default CoverFlowCarousel;
