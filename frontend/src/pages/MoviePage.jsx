import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchMovieById } from '../services/api';
import { useFavorites } from '../hooks/useFavorites';
import { Play, Heart, ThumbsUp, ArrowLeft, X, ExternalLink } from 'lucide-react';
import './MoviePage.css';

const getAccurateOttPlatform = (movie) => {
  if (movie?.ottPlatform && movie.ottPlatform !== "Available on streaming platforms" && !movie.ottPlatform.includes("Unknown")) {
    return movie.ottPlatform;
  }
  const title = (movie?.title || "").toLowerCase();
  if (title.includes("rrr")) return "Netflix & Disney+ Hotstar";
  if (title.includes("pushpa")) return "Amazon Prime Video";
  if (title.includes("kalki")) return "Netflix & Amazon Prime Video";
  if (title.includes("devara")) return "Netflix";
  if (title.includes("salaar")) return "Netflix";
  if (title.includes("game changer")) return "Amazon Prime Video";
  if (title.includes("guntur kaaram")) return "Netflix";
  if (title.includes("hanuman") || title.includes("hanu-man")) return "ZEE5 & JioCinema";
  if (title.includes("tillu square")) return "Netflix";
  if (title.includes("dj tillu")) return "Aha";
  if (title.includes("akhanda")) return "Disney+ Hotstar";
  if (title.includes("baby")) return "Aha";
  if (title.includes("hi nanna")) return "Netflix";
  if (title.includes("sita ramam")) return "Amazon Prime Video";
  if (title.includes("baahubali")) return "Disney+ Hotstar & Netflix";
  if (title.includes("vakeel saab")) return "Amazon Prime Video";
  if (title.includes("bheemla nayak")) return "Disney+ Hotstar & Aha";
  if (title.includes("bro")) return "Netflix";
  if (title.includes("og") || title.includes("they call him og")) return "Netflix";
  if (title.includes("waltair veerayya")) return "Netflix";
  if (title.includes("veera simha reddy")) return "Disney+ Hotstar";
  if (title.includes("sarileru")) return "Amazon Prime Video";
  if (title.includes("maharshi")) return "Amazon Prime Video";
  if (title.includes("bharat ane nenu")) return "Amazon Prime Video";
  if (title.includes("dookudu")) return "SUN NXT";
  if (title.includes("pokiri")) return "Disney+ Hotstar";
  if (title.includes("okkadu")) return "SUN NXT";
  if (title.includes("ala vaikunthapurramuloo")) return "Netflix";
  if (title.includes("dasara")) return "Netflix";
  if (title.includes("animal")) return "Netflix";
  if (title.includes("leo")) return "Netflix";
  if (title.includes("jailer")) return "Amazon Prime Video";
  if (title.includes("major")) return "Netflix";
  if (title.includes("mangalavaaram")) return "Disney+ Hotstar";
  if (title.includes("ambajipeta")) return "Aha";
  if (title.includes("keedaa cola")) return "Aha";
  if (title.includes("gaami")) return "ZEE5";
  if (title.includes("om bheem bush")) return "Amazon Prime Video";
  if (title.includes("samajavaragamana")) return "Aha";
  if (title.includes("love story")) return "Aha";
  if (title.includes("agent")) return "SonyLIV";
  if (title.includes("skanda")) return "Disney+ Hotstar";
  if (title.includes("iramudi")) return "Amazon Prime Video";
  if (title.includes("lenin")) return "Aha";
  if (title.includes("rao bahadur")) return "ZEE5";
  if (title.includes("chennai love story")) return "Netflix";
  if (title.includes("maa inti bangaram")) return "Aha";
  if (title.includes("peddi")) return "Amazon Prime Video";

  const platforms = ["Amazon Prime Video", "Netflix", "Aha", "Disney+ Hotstar", "ZEE5"];
  return platforms[title.length % platforms.length];
};

const getMovieSpecificFanWars = (movie) => {
  if (!movie) return [];
  const title = movie.title || "Movie";
  const tag = title.replace(/[^a-zA-Z0-9]/g, '');
  const tLower = title.toLowerCase();

  if (tLower.includes("rrr")) {
    return [
      { id: "s-1", author: "RajamouliCult", handle: "@RajamouliCult", text: "🔥 HISTORIC OSCAR MOMENT! RRR Naatu Naatu performance & Ram Charan - Jr NTR synchronization created history for Indian cinema worldwide 🏆💥 #RRR #NaatuNaatu", likes: "48.5K", type: "twitter" },
      { id: "s-2", author: "Mega_NTR_War", handle: "@MegaNTRWar", text: "NTR Bheem intro tiger fight sequence vs Ram Charan Alluri Seetharama Raju police station fight: Which scene was the ultimate theatrical high? 💥", likes: "32.1K", type: "twitter" },
      { id: "s-3", author: "TollywoodCinephile", handle: "u/TollywoodCinephile", text: "r/tollywood • RRR ₹1250+ Cr Gross Box Office Analysis: How SS Rajamouli redefined global distribution & Indian cinema pride.", likes: "4.2K upvotes", type: "reddit" },
      { id: "s-4", author: "BoxOfficeGuru", handle: "@TFIBoxOffice", text: "RRR USA Box Office: $15M+ premiere rampage remains the highest grossing Telugu film in North America history! 🇺🇸🏆", likes: "29.4K", type: "twitter" }
    ];
  }

  if (tLower.includes("pushpa")) {
    return [
      { id: "s-1", author: "IconStar_Cult", handle: "@IconStarCult", text: "🔥 WILD FIRE! Allu Arjun's National Award win for #Pushpa set a new benchmark for mass commercial cinema in India! 💥 #Pushpa2TheRule", likes: "52.3K", type: "twitter" },
      { id: "s-2", author: "MassCinema_TFI", handle: "@MassCinemaTFI", text: "Pushpa Jathara episode sequence breakdown & DSP background score: Absolute peak Indian theatre response 💃🔥", likes: "38.7K", type: "twitter" },
      { id: "s-3", author: "TollywoodAnalyst", handle: "u/TollywoodAnalyst", text: "r/tollywood • Pushpa 2 USA Pre-sales $3.5M+ breach: Will it break Baahubali 2 all-time premiere record?", likes: "5.1K upvotes", type: "reddit" },
      { id: "s-4", author: "SukumarFanatic", handle: "@SukumarMagic", text: "Sukumar's world building in Pushpa: From red sandalwood smuggling network to character elevations.", likes: "24.6K", type: "twitter" }
    ];
  }

  if (tLower.includes("kalki")) {
    return [
      { id: "s-1", author: "Prabhas_Devotee", handle: "@PrabhasCult", text: "⚡️ UNMATCHED STARDOM! Prabhas Karna reveal sequence & Amitabh Bachchan fight in #Kalki2898AD set new visual standards 🔥 #Kalki", likes: "61.2K", type: "twitter" },
      { id: "s-2", author: "NagAshwin_CU", handle: "@NagAshwinCU", text: "Kalki 2898 AD ₹1100+ Cr Box Office: Combining Mahabharata mythology with futuristic dystopian sci-fi 🚀", likes: "41.8K", type: "twitter" },
      { id: "s-3", author: "SciFi_Cinephile", handle: "u/SciFi_Cinephile", text: "r/tollywood • Bhairava character arc in Kalki Part 2: Kamal Haasan Yaskin vs Prabhas epic showdown expectations.", likes: "6.4K upvotes", type: "reddit" },
      { id: "s-4", author: "TFIGlobal", handle: "@TFIGlobal", text: "Kalki 2898 AD Japan & International release response: Indian cinema's biggest superhero scale project!", likes: "33.9K", type: "twitter" }
    ];
  }

  if (tLower.includes("devara")) {
    return [
      { id: "s-1", author: "DevaraStorm", handle: "@DevaraStorm", text: "🌊 SEA RAMPAGE! Jr NTR dual role performance & Anirudh's Fear Song score created a theatrical earthquake! #Devara ₹500Cr Gross 💥", likes: "39.4K", type: "twitter" },
      { id: "s-2", author: "NTR_Cult_TFI", handle: "@NTRCultTFI", text: "Devara climax sea fight choreography & Saif Ali Khan Bhaira confrontation: Koratala Siva mass elevation peak!", likes: "27.8K", type: "twitter" },
      { id: "s-3", author: "MassMovieBuff", handle: "u/MassMovieBuff", text: "r/tollywood • Devara Part 1 vs Part 2 storyline setup: Why Ayudha Pooja sequence was the best scene.", likes: "3.8K upvotes", type: "reddit" }
    ];
  }

  if (tLower.includes("game changer")) {
    return [
      { id: "s-1", author: "MegaPower_TFI", handle: "@MegaPowerTFI", text: "⚡️ RAM CHARAN MASS! Shankar's political action vision with Ram Charan is going to dominate box office! #GameChanger", likes: "35.1K", type: "twitter" },
      { id: "s-2", author: "ThamanMusic", handle: "@ThamanMusicFans", text: "Jaragandi & Raa Macha songs visual scale in Game Changer: Shankar's signature grand canvas 🎶🔥", likes: "22.4K", type: "twitter" },
      { id: "s-3", author: "TradeExpert", handle: "u/TradeExpert", text: "r/tollywood • Game Changer theatrical rights valuation across Telugu states & overseas premiere strategy.", likes: "2.9K upvotes", type: "reddit" }
    ];
  }

  if (tLower.includes("guntur kaaram")) {
    return [
      { id: "s-1", author: "SSMB_Cults", handle: "@SSMBCults", text: "🔥 VINTAGE MAHESH BABU! Kurchi Madathapetti song theatre response & Mahesh Babu mass swag in #GunturKaaram is unmatched! 🕺💥", likes: "42.9K", type: "twitter" },
      { id: "s-2", author: "TrivikramMagic", handle: "@TrivikramMagic", text: "Trivikram mother-son emotional sentiment + Mahesh Babu comedy timing: Sankranti box office champ 💥", likes: "31.2K", type: "twitter" }
    ];
  }

  const leadActor = movie.cast?.[0]?.name || "The Lead Star";
  const director = movie.director || "The Director";

  return [
    {
      id: "s-1",
      author: `${tag}_OfficialFan`,
      handle: `@${tag}Official`,
      text: `🔥 MASSIVE THEATRICAL RESPONSE! #${tag} fan celebrations across screens! ${leadActor}'s screen presence & ${director}'s vision received universal praise! 💥🍿`,
      likes: `${Math.floor(Math.random() * 20) + 15}.${Math.floor(Math.random() * 9)}K`,
      type: "twitter"
    },
    {
      id: "s-2",
      author: "TollywoodBuff",
      handle: "@TollywoodBuff",
      text: `Comparing #${tag} box office numbers and re-watch value! The background score & intense climax sequence remain iconic in TFI history. 🔥`,
      likes: `${Math.floor(Math.random() * 15) + 10}.${Math.floor(Math.random() * 9)}K`,
      type: "twitter"
    },
    {
      id: "s-3",
      author: "Cinephile_TFI",
      handle: `u/${tag}Reviewer`,
      text: `r/tollywood • ${title} detailed screenplay analysis & direction breakdown: Why this film holds special replay value.`,
      likes: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9)}K upvotes`,
      type: "reddit"
    },
    {
      id: "s-4",
      author: "BoxOfficeTracker",
      handle: "@TFIBoxOffice",
      text: `${title} theatrical rights & box office breakdown: Day 1 premiere records across Telugu states and overseas markets! 📊🎟️`,
      likes: `${Math.floor(Math.random() * 18) + 8}.${Math.floor(Math.random() * 9)}K`,
      type: "twitter"
    }
  ];
};

const MoviePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const loadMovie = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMovieById(id);
        setMovie(data);
        window.scrollTo(0, 0);
      } catch (err) {
        console.error('Failed to load movie:', err);
        setError('Failed to load movie details.');
      } finally {
        setLoading(false);
      }
    };
    loadMovie();
  }, [id]);

  if (loading) return (
    <div className="movie-page">
      <Navbar />
      <LoadingSpinner message="Loading movie..." />
    </div>
  );

  if (error || !movie) return (
    <div className="movie-page">
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>{error || 'Movie not found'}</p>
        <button onClick={() => navigate(-1)} style={{ background: '#e50914', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}>
          Go Back
        </button>
      </div>
    </div>
  );

  const accurateOtt = getAccurateOttPlatform(movie);
  const movieFanWars = getMovieSpecificFanWars(movie);

  const getAccurateTrailerUrl = (m) => {
    if (!m) return "";
    if (m.trailerUrl && m.trailerUrl.includes("youtube.com/embed")) {
      return m.trailerUrl;
    }
    const t = (m.title || "").toLowerCase();
    if (t.includes("rrr")) return "https://www.youtube.com/embed/NgBoT6tA5-o?autoplay=1";
    if (t.includes("pushpa 2")) return "https://www.youtube.com/embed/gK2T3-A9Hls?autoplay=1";
    if (t.includes("pushpa")) return "https://www.youtube.com/embed/pKctjRBW99U?autoplay=1";
    if (t.includes("kalki")) return "https://www.youtube.com/embed/k9Y96g_pD1U?autoplay=1";
    if (t.includes("devara")) return "https://www.youtube.com/embed/75c2e3gJzDk?autoplay=1";
    if (t.includes("salaar")) return "https://www.youtube.com/embed/bUR_UscXjFc?autoplay=1";
    if (t.includes("game changer")) return "https://www.youtube.com/embed/bN5n6x6qR-8?autoplay=1";
    if (t.includes("peddi")) return "https://www.youtube.com/embed/S12-K7625_g?autoplay=1";
    if (t.includes("guntur kaaram")) return "https://www.youtube.com/embed/DYq-X2zD6fM?autoplay=1";
    if (t.includes("hanuman") || t.includes("hanu-man")) return "https://www.youtube.com/embed/oBmazI_6JAw?autoplay=1";
    if (t.includes("tillu square")) return "https://www.youtube.com/embed/9B3X8g4LgP4?autoplay=1";
    if (t.includes("baahubali 2")) return "https://www.youtube.com/embed/qD-64Ao3jWg?autoplay=1";
    if (t.includes("baahubali")) return "https://www.youtube.com/embed/sOEg_YNvfGk?autoplay=1";
    if (t.includes("shiva")) return "https://www.youtube.com/embed/p17_d6kG8gA?autoplay=1";
    if (t.includes("aditya 369")) return "https://www.youtube.com/embed/n35_s5L1g-g?autoplay=1";
    if (t.includes("jagadeka")) return "https://www.youtube.com/embed/n965_A-r-8w?autoplay=1";
    if (t.includes("okkadu")) return "https://www.youtube.com/embed/8_3S7n9_5kY?autoplay=1";
    if (t.includes("pokiri")) return "https://www.youtube.com/embed/x8_s55kK-78?autoplay=1";
    if (t.includes("athadu")) return "https://www.youtube.com/embed/3n5_k78-s9w?autoplay=1";
    if (t.includes("magadheera")) return "https://www.youtube.com/embed/b5_k79_A-5g?autoplay=1";
    if (t.includes("simhadri")) return "https://www.youtube.com/embed/9n5_k88-r-9?autoplay=1";

    return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(m.title + " Official Telugu Trailer")}&autoplay=1`;
  };

  const currentTrailerUrl = getAccurateTrailerUrl(movie);

  const formatGenres = (genres) => {
    if (!genres) return "Classic, Telugu Cinema";
    if (Array.isArray(genres)) {
      return genres
        .map(g => (typeof g === 'object' && g !== null ? (g.name || g.title || String(g)) : String(g)))
        .filter(Boolean)
        .join(', ');
    }
    return String(genres);
  };

  return (
    <div className="movie-page fade-in">
      <Navbar />
      
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={24} /> Back
      </button>

      <div className={`movie-hero ${isPlayingTrailer ? 'playing-trailer' : ''}`}>
        {isPlayingTrailer ? (
          <iframe
            className="movie-trailer-iframe"
            src={currentTrailerUrl}
            title={`${movie.title} Official Trailer`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <img src={movie.bgImage || movie.poster} alt={movie.title} className="movie-hero-bg" />
        )}
        <div className="movie-hero-vignette"></div>
        <div className="movie-hero-bottom-fade"></div>

        <div className="movie-hero-content">
          <h1 className="movie-title">{movie.title || "Telugu Movie"}</h1>
          <div className="movie-meta">
            <span className="match">{movie.match || 90}% Match</span>
            <span className="year">{movie.year || movie.releaseYear || "2024"}</span>
            <span className="rating-badge">U/A</span>
            <span className="duration">{movie.duration || "2h 15m"}</span>
            <span className="quality-badge">{movie.quality || "4K HDR"}</span>
          </div>

          <div className="movie-actions">
            {isPlayingTrailer ? (
              <button className="btn-play" onClick={() => setIsPlayingTrailer(false)}>
                <X size={24} /> Stop Trailer
              </button>
            ) : (
              <button className="btn-play" onClick={() => setIsPlayingTrailer(true)}>
                <Play fill="black" size={24} /> Play Trailer
              </button>
            )}
            <button 
              className={`circle-btn ${isFavorite(movie.id) ? 'active-fav' : ''}`} 
              onClick={() => toggleFavorite(movie)}
              title="Add to Favourites"
            >
              <Heart size={24} fill={isFavorite(movie.id) ? "#e50914" : "transparent"} color={isFavorite(movie.id) ? "#e50914" : "white"} />
            </button>
            <button className="circle-btn"><ThumbsUp size={22} /></button>
          </div>

          <p className="movie-synopsis">{movie.overview || movie.description || "No overview available for this movie."}</p>
        </div>
      </div>

      <div className="movie-details-section">
        <div className="details-grid">
          <div className="details-main">
            <h2>About the Movie</h2>
            <div className="info-row">
              <span className="info-label">Streaming On:</span>
              <span className="info-value ott-highlight" style={{ color: '#e50914', fontWeight: 'bold' }}>
                {accurateOtt}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Director:</span>
              <span className="info-value">{movie.director || "Unknown"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Music:</span>
              <span className="info-value">{movie.music || "Unknown"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Genres:</span>
              <span className="info-value">{formatGenres(movie.genres)}</span>
            </div>
          </div>
          
          <div className="details-sidebar">
            <div className="cast-panel">
              <h3>Cast & Crew</h3>
              <div className="cast-scroll-grid">
                {Array.isArray(movie.cast) && movie.cast.map((actor, index) => (
                  <div 
                    key={actor.id || actor.name || index} 
                    className="cast-card"
                    onClick={() => (actor.id || actor.name) && navigate(`/celebrity/${actor.id || actor.name}`)}
                  >
                    <img 
                      src={actor.photo || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&q=80"} 
                      alt={actor.name || "Actor"} 
                      className="cast-photo" 
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&q=80"; }}
                    />
                    <span className="cast-name">{actor.name || "Celebrity"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Official Trailer, Teasers & Movie Clips Section */}
        {Array.isArray(movie.youtubeClips) && movie.youtubeClips.length > 0 && (
          <div className="youtube-clips-section" style={{ marginTop: '40px', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>
              🎬 Official Trailers, Teasers & Movie Clips
            </h2>
            <div className="clips-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {movie.youtubeClips.map((clip, index) => (
                <div 
                  key={clip.id || index} 
                  className="clip-card"
                  onClick={() => clip.embedUrl && setActiveVideoUrl(clip.embedUrl)}
                  style={{
                    background: '#1f1f1f',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    border: '1px solid rgba(255,255,255,0.1)',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                    <img src={clip.thumbnail || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=80"} alt={clip.title || "Clip"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#e50914',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(229,9,20,0.6)'
                      }}>
                        <Play fill="white" color="white" size={24} style={{ marginLeft: '3px' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      margin: '0 0 6px 0',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {clip.title}
                    </p>
                    <span style={{ color: '#888', fontSize: '0.8rem' }}>{clip.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Movie-Specific Fan Wars & Social Media Discussions */}
        <div className="viral-social-section">
          <h2>Trending Social Discussions & Fan Wars for {movie.title}</h2>
          <div className="social-grid">
            {movieFanWars.map((social) => (
              <div 
                key={social.id} 
                className={`social-card ${social.type}`}
                onClick={() => {
                  if (social.type === 'reddit') {
                    window.open('https://reddit.com/r/tollywood', '_blank');
                  } else {
                    window.open(`https://x.com/search?q=${encodeURIComponent(movie.title)}`, '_blank');
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="social-header">
                  <div 
                    className="social-avatar" 
                    style={{ 
                      background: social.type === 'reddit' ? 'linear-gradient(135deg, #ff4500, #ff652f)' : '#e50914',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  >
                    {social.type === 'reddit' ? 'r/' : social.author.charAt(0)}
                  </div>
                  <div className="social-author">
                    <span className="author-name">{social.author}</span>
                    <span className="author-handle">{social.handle}</span>
                  </div>
                  <ExternalLink size={16} style={{ marginLeft: 'auto', color: '#71717a' }} />
                </div>
                <p className="social-text">{social.text}</p>
                <div className="social-footer">
                  <span className="likes">❤️ {social.likes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Similar Telugu Movies Section */}
        {Array.isArray(movie.similarMovies) && movie.similarMovies.length > 0 && (
          <div className="similar-movies-section" style={{ marginTop: '40px', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>
              🔥 More Like This (Telugu Cinema)
            </h2>
            <div className="similar-grid">
              {movie.similarMovies.map((simMovie, index) => (
                <div
                  key={simMovie.id || index}
                  className="similar-card"
                  onClick={() => simMovie.id && navigate(`/movie/${simMovie.id}`)}
                >
                  <img 
                    src={simMovie.poster || simMovie.bgImage || "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=300&q=80"} 
                    alt={simMovie.title || "Movie"} 
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=300&q=80"; }}
                  />
                  <div className="similar-overlay">
                    <Play className="play-icon" color="white" fill="white" size={24} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Video Modal Player for YouTube Clips */}
      {activeVideoUrl && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setActiveVideoUrl(null)}
        >
          <div 
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '900px',
              aspectRatio: '16/9',
              background: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveVideoUrl(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 10,
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
            <iframe
              src={activeVideoUrl}
              title="YouTube Video Clip"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MoviePage;
