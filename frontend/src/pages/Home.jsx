import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import MovieCarousel from '../components/MovieCarousel';
import Top10Row from '../components/Top10Row';
import BoxOffice from '../components/BoxOffice';
import Footer from '../components/Footer';
import TestimonialV2 from '../components/ui/testimonial-v2';
import LoadingSpinner from '../components/LoadingSpinner';
import ThreeCinema from '../components/ThreeCinema';
import MovieSetLanding from '../components/MovieSetLanding';
import {
  fetchHeroMovie,
  fetchTrendingMovies,
  fetchTop10,
  fetchNewReleases,
  fetchActionMovies,
  fetchDramaMovies,
  fetchBoxOfficeStats,
  fetchSocialTrending,
  fetchUltraClassics,
  fetchRomanticMovies,
  fetchSciFiMovies,
  fetchComedyMovies,
  fetchMythologicalMovies,
  fetchThrillerMovies,
  fetchCrimeMovies,
  fetchFamilyMovies,
  fetchSuperheroMovies,
  fetchBlockbusters,
  fetchAwardWinners,
} from '../services/api';

const Home = () => {
  const [heroData, setHeroData] = useState(null);
  const [trending, setTrending] = useState([]);
  const [top10, setTop10] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [dramaMovies, setDramaMovies] = useState([]);
  const [ultraClassics, setUltraClassics] = useState([]);
  const [romanticMovies, setRomanticMovies] = useState([]);
  const [sciFiMovies, setSciFiMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [mythologicalMovies, setMythologicalMovies] = useState([]);
  const [thrillerMovies, setThrillerMovies] = useState([]);
  const [crimeMovies, setCrimeMovies] = useState([]);
  const [familyMovies, setFamilyMovies] = useState([]);
  const [superheroMovies, setSuperheroMovies] = useState([]);
  const [blockbusters, setBlockbusters] = useState([]);
  const [awardWinners, setAwardWinners] = useState([]);
  const [boxOffice, setBoxOffice] = useState([]);
  const [social, setSocial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUniverseEntered, setIsUniverseEntered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [
          hero, trend, t10, newR, action, drama, bo, soc,
          classics, romance, scifi, comedy, mythological,
          thriller, crime, family, superhero, blocks, awards
        ] = await Promise.all([
          fetchHeroMovie(),
          fetchTrendingMovies(),
          fetchTop10(),
          fetchNewReleases(),
          fetchActionMovies(),
          fetchDramaMovies(),
          fetchBoxOfficeStats(),
          fetchSocialTrending(),
          fetchUltraClassics(),
          fetchRomanticMovies(),
          fetchSciFiMovies(),
          fetchComedyMovies(),
          fetchMythologicalMovies(),
          fetchThrillerMovies(),
          fetchCrimeMovies(),
          fetchFamilyMovies(),
          fetchSuperheroMovies(),
          fetchBlockbusters(),
          fetchAwardWinners(),
        ]);
        setHeroData(hero);
        setTrending(trend);
        setTop10(t10);
        setNewReleases(newR);
        setActionMovies(action);
        setDramaMovies(drama);
        setBoxOffice(bo);
        setSocial(soc);
        setUltraClassics(classics);
        setRomanticMovies(romance);
        setSciFiMovies(scifi);
        setComedyMovies(comedy);
        setMythologicalMovies(mythological);
        setThrillerMovies(thriller);
        setCrimeMovies(crime);
        setFamilyMovies(family);
        setSuperheroMovies(superhero);
        setBlockbusters(blocks);
        setAwardWinners(awards);
      } catch (err) {
        console.error('Failed to load home data:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadAll();

    // Live background polling interval: Automatically update Hero Carousel & Trending Top 10 in real-time
    const liveInterval = setInterval(async () => {
      try {
        const [liveHero, liveTrending, liveTop10] = await Promise.all([
          fetchHeroMovie(),
          fetchTrendingMovies(),
          fetchTop10(),
        ]);
        if (liveHero && liveHero.length > 0) setHeroData(liveHero);
        if (liveTrending && liveTrending.length > 0) setTrending(liveTrending);
        if (liveTop10 && liveTop10.length > 0) setTop10(liveTop10);
      } catch (err) {
        console.warn('Live background polling sync error:', err.message);
      }
    }, 60000);

    return () => clearInterval(liveInterval);
  }, []);

  // Body scroll is always enabled
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleMovieClick = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  if (loading) {
    return (
      <div className="home-page">
        <Navbar />
        <LoadingSpinner message="Loading TFI_CONNECTS..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <p style={{ color: '#888', fontSize: '1.1rem' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ background: '#e50914', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Navbar />
      <MovieSetLanding onEnterUniverse={() => setIsUniverseEntered(true)} />
      <Hero movies={heroData} />

      <Top10Row title="Trending Now" movies={top10.length > 0 ? top10 : trending} />
      <MovieCarousel title="🎬 New Releases" movies={newReleases} categoryKey="new-releases" onMovieClick={handleMovieClick} />
      <MovieCarousel title="🏆 Award Winning Films" movies={awardWinners} categoryKey="award-winners" onMovieClick={handleMovieClick} />
      <MovieCarousel title="⚡ Action Blockbusters" movies={actionMovies} categoryKey="action" onMovieClick={handleMovieClick} />
      <MovieCarousel title="🦸 Heroes & Legends" movies={superheroMovies} categoryKey="superhero" onMovieClick={handleMovieClick} />
      <MovieCarousel title="😂 Laugh Out Loud Comedies" movies={comedyMovies} categoryKey="comedy" onMovieClick={handleMovieClick} />
      <MovieCarousel title="💕 Romantic Tales" movies={romanticMovies} categoryKey="romance" onMovieClick={handleMovieClick} />
      <MovieCarousel title="🔍 Crime & Dark Thrillers" movies={crimeMovies} categoryKey="crime" onMovieClick={handleMovieClick} />
      <MovieCarousel title="😱 Suspense & Thrillers" movies={thrillerMovies} categoryKey="thriller" onMovieClick={handleMovieClick} />
      <MovieCarousel title="🚀 Sci-Fi & Fictional" movies={sciFiMovies} categoryKey="scifi" onMovieClick={handleMovieClick} />
      <MovieCarousel title="🎭 Critically Acclaimed Dramas" movies={dramaMovies} categoryKey="drama" onMovieClick={handleMovieClick} />
      <MovieCarousel title="👨‍👩‍👧 Family Entertainers" movies={familyMovies} categoryKey="family" onMovieClick={handleMovieClick} />
      <MovieCarousel title="🌟 Mythological Epics" movies={mythologicalMovies} categoryKey="mythological" onMovieClick={handleMovieClick} />
      <MovieCarousel title="🏛️ Ultra Classics of TFI" movies={ultraClassics} categoryKey="classics" onMovieClick={handleMovieClick} />
      <TestimonialV2 />
      <Footer />
    </div>
  );
};

export default Home;
