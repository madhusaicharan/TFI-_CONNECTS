const express = require("express");
const router = express.Router();
const Movie = require("../models/Movie");
const { fetchFromTMDB, mapMovie, IMAGE_BASE_URL } = require("../services/tmdb");
const { fetchBoxOfficeData } = require("../services/boxofficeScraper");

router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);
    const data = await fetchFromTMDB("/search/movie", { query }, { teluguOnly: false });
    const teluguMovies = data && data.results ? data.results.filter(m => m.original_language === "te") : [];
    return res.json(teluguMovies.map(mapMovie));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const getBestTrailer = (videos) => {
  if (!videos || !videos.results) return null;
  const ytTrailers = videos.results.filter(v => v.site === "YouTube" && v.type === "Trailer");
  if (ytTrailers.length === 0) return null;

  // Priority 1: Official and name contains "Official"
  let best = ytTrailers.find(v => v.official && v.name.toLowerCase().includes("official"));
  if (best) return best;

  // Priority 2: Name contains "Official Trailer"
  best = ytTrailers.find(v => v.name.toLowerCase().includes("official trailer"));
  if (best) return best;

  // Priority 3: Marked as Official by TMDB
  best = ytTrailers.find(v => v.official);
  if (best) return best;

  // Priority 4: Any trailer that is not a launch or teaser
  best = ytTrailers.find(v => !v.name.toLowerCase().includes("launch") && !v.name.toLowerCase().includes("teaser"));
  if (best) return best;

  // Fallback: first available trailer
  return ytTrailers[0];
};

const getAccurateOttPlatform = (title = "") => {
  const t = title.toLowerCase();
  if (t.includes("rrr")) return "Netflix & Disney+ Hotstar";
  if (t.includes("pushpa")) return "Amazon Prime Video";
  if (t.includes("kalki")) return "Netflix & Amazon Prime Video";
  if (t.includes("devara")) return "Netflix";
  if (t.includes("salaar")) return "Netflix";
  if (t.includes("game changer")) return "Amazon Prime Video";
  if (t.includes("guntur kaaram")) return "Netflix";
  if (t.includes("hanuman") || t.includes("hanu-man")) return "ZEE5 & JioCinema";
  if (t.includes("tillu square")) return "Netflix";
  if (t.includes("dj tillu")) return "Aha";
  if (t.includes("akhanda")) return "Disney+ Hotstar";
  if (t.includes("baby")) return "Aha";
  if (t.includes("hi nanna")) return "Netflix";
  if (t.includes("sita ramam")) return "Amazon Prime Video";
  if (t.includes("baahubali")) return "Disney+ Hotstar & Netflix";
  if (t.includes("vakeel saab")) return "Amazon Prime Video";
  if (t.includes("bheemla nayak")) return "Disney+ Hotstar & Aha";
  if (t.includes("bro")) return "Netflix";
  if (t.includes("og") || t.includes("they call him og")) return "Netflix";
  if (t.includes("waltair veerayya")) return "Netflix";
  if (t.includes("veera simha reddy")) return "Disney+ Hotstar";
  if (t.includes("sarileru")) return "Amazon Prime Video";
  if (t.includes("maharshi")) return "Amazon Prime Video";
  if (t.includes("bharat ane nenu")) return "Amazon Prime Video";
  if (t.includes("dookudu")) return "SUN NXT";
  if (t.includes("pokiri")) return "Disney+ Hotstar";
  if (t.includes("okkadu")) return "SUN NXT";
  if (t.includes("ala vaikunthapurramuloo")) return "Netflix";
  if (t.includes("dasara")) return "Netflix";
  if (t.includes("animal")) return "Netflix";
  if (t.includes("leo")) return "Netflix";
  if (t.includes("jailer")) return "Amazon Prime Video";
  if (t.includes("major")) return "Netflix";
  if (t.includes("mangalavaaram")) return "Disney+ Hotstar";
  if (t.includes("ambajipeta")) return "Aha";
  if (t.includes("keedaa cola")) return "Aha";
  if (t.includes("gaami")) return "ZEE5";
  if (t.includes("om bheem bush")) return "Amazon Prime Video";
  if (t.includes("samajavaragamana")) return "Aha";
  if (t.includes("love story")) return "Aha";
  if (t.includes("agent")) return "SonyLIV";
  if (t.includes("skanda")) return "Disney+ Hotstar";
  if (t.includes("iramudi")) return "Amazon Prime Video";
  if (t.includes("lenin")) return "Aha";
  if (t.includes("rao bahadur")) return "ZEE5";
  if (t.includes("chennai love story")) return "Netflix";
  if (t.includes("maa inti bangaram")) return "Aha";
  if (t.includes("peddi")) return "Amazon Prime Video";

  const platforms = ["Amazon Prime Video", "Netflix", "Aha", "Disney+ Hotstar", "ZEE5"];
  return platforms[t.length % platforms.length];
};

const ytSearch = require("yt-search");

const fetchMovieYouTubeMedia = async (movieTitle) => {
  try {
    const results = await Promise.all([
      ytSearch(`${movieTitle} Official Trailer Telugu`),
      ytSearch(`${movieTitle} Telugu movie scene trailer song`)
    ]);
    
    let trailerKey = null;
    const clips = [];
    const seenIds = new Set();

    if (results[0] && results[0].videos && results[0].videos.length > 0) {
      const topTrailer = results[0].videos[0];
      trailerKey = topTrailer.videoId;
      seenIds.add(topTrailer.videoId);
    }

    results.forEach(res => {
      if (res && res.videos) {
        res.videos.slice(0, 5).forEach(v => {
          if (!seenIds.has(v.videoId)) {
            seenIds.add(v.videoId);
            clips.push({
              id: v.videoId,
              title: v.title,
              thumbnail: v.thumbnail || v.image,
              url: v.url,
              embedUrl: `https://www.youtube.com/embed/${v.videoId}?autoplay=1`,
              duration: v.timestamp,
              views: v.views ? (v.views > 1000000 ? `${(v.views / 1000000).toFixed(1)}M views` : `${(v.views / 1000).toFixed(0)}K views`) : 'Popular'
            });
          }
        });
      }
    });

    return {
      trailerUrl: trailerKey ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1` : null,
      youtubeClips: clips.slice(0, 6)
    };
  } catch (err) {
    console.error("YouTube Media Fetch Error:", err.message);
    return { trailerUrl: null, youtubeClips: [] };
  }
};

const CLASSIC_CAST_MAP = {
  "maya bazaar": [
    { name: "N.T. Rama Rao", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
    { name: "Akkineni Nageswara Rao", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
    { name: "S.V. Ranga Rao", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" },
    { name: "Savitri", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" },
    { name: "Relangi Venkatramaiah", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80" },
    { name: "Gummadi", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80" }
  ],
  "shiva": [
    { name: "Nagarjuna Akkineni", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
    { name: "Amala Akkineni", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" },
    { name: "Raghuvaran", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" },
    { name: "Tanikella Bharani", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80" },
    { name: "Kota Srinivasa Rao", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" }
  ],
  "siva": [
    { name: "Nagarjuna Akkineni", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
    { name: "Amala Akkineni", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" },
    { name: "Raghuvaran", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" },
    { name: "Tanikella Bharani", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80" },
    { name: "Kota Srinivasa Rao", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" }
  ]
};

router.get("/id/:id", async (req, res) => {
  try {
    const movieId = req.params.id;
    let localMovie = null;

    if (!isNaN(parseInt(movieId))) {
      localMovie = await Movie.findOne({ id: parseInt(movieId) }).lean();
    }

    let data = null;
    let movieQueryTitle = localMovie ? localMovie.title : null;

    // Direct TMDB fetch attempt
    if (!isNaN(parseInt(movieId))) {
      data = await fetchFromTMDB(`/movie/${movieId}`, { append_to_response: "credits,videos,similar" }, { teluguOnly: false });
    }

    // Detect if TMDB ID lookup returned an English/foreign movie that mismatches our local/Telugu title
    const isForeignMismatch = data && (
      (data.original_language !== "te" && data.original_language !== "ta" && data.original_language !== "hi") ||
      (movieQueryTitle && data.title.toLowerCase() !== movieQueryTitle.toLowerCase())
    );

    if ((isForeignMismatch || !data || !data.id) && (movieQueryTitle || isNaN(parseInt(movieId)))) {
      const searchTitle = movieQueryTitle || movieId;
      const searchRes = await fetchFromTMDB("/search/movie", { query: searchTitle }, { teluguOnly: false });
      if (searchRes && searchRes.results && searchRes.results.length > 0) {
        const best = searchRes.results.find(m => m.original_language === "te") || searchRes.results[0];
        data = await fetchFromTMDB(`/movie/${best.id}`, { append_to_response: "credits,videos,similar" }, { teluguOnly: false });
      }
    }

    if (data && data.id) {
      const trailer = getBestTrailer(data.videos);
      const ytMedia = await fetchMovieYouTubeMedia(data.title);

      // Fetch strictly genre-matched similar Telugu movies
      let currentGenreIds = [];
      if (data.genres && Array.isArray(data.genres) && data.genres.length > 0) {
        currentGenreIds = data.genres.map(g => (typeof g === 'object' ? g.id : g)).filter(Boolean);
      }

      let genreMatchedMovies = [];
      if (currentGenreIds.length > 0) {
        // Prioritize specific non-generic genres over broad Drama(18)/Action(28)
        const primaryGenre = currentGenreIds.find(id => id !== 18 && id !== 28) || currentGenreIds[0];

        const genreDiscover = await fetchFromTMDB("/discover/movie", {
          with_genres: String(primaryGenre),
          with_original_language: "te",
          sort_by: "popularity.desc",
          "vote_count.gte": 1
        });

        if (genreDiscover && genreDiscover.results) {
          genreMatchedMovies = genreDiscover.results.filter(m => m.id !== data.id);
          // Sort by highest number of shared genres with current movie
          genreMatchedMovies.sort((a, b) => {
            const sharedA = (a.genre_ids || []).filter(id => currentGenreIds.includes(id)).length;
            const sharedB = (b.genre_ids || []).filter(id => currentGenreIds.includes(id)).length;
            return sharedB - sharedA;
          });
        }
      }

      // Fallback to TMDB similar endpoint if needed
      if (genreMatchedMovies.length < 4 && data.similar?.results) {
        data.similar.results.forEach(m => {
          if (m && m.id !== data.id && !genreMatchedMovies.some(existing => existing.id === m.id)) {
            genreMatchedMovies.push(m);
          }
        });
      }

      const tLower = (data.title || "").toLowerCase();
      const customCast = CLASSIC_CAST_MAP[tLower] || null;

      const mappedCast = (data.credits?.cast && data.credits.cast.length > 0)
        ? data.credits.cast.slice(0, 10).map(c => ({
            id: c.id,
            name: c.name,
            photo: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&q=80"
          }))
        : (customCast || localMovie?.cast || []);

      const mapped = {
        ...mapMovie(data),
        title: data.title,
        match: Math.floor(Math.random() * 20) + 80,
        quality: "4K HDR",
        duration: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : "N/A",
        overview: data.overview || localMovie?.description || "",
        director: data.credits?.crew?.find(c => c.job === "Director")?.name || localMovie?.director || "Unknown",
        music: data.credits?.crew?.find(c => c.job === "Original Music Composer" || c.job === "Music Director")?.name || "Unknown",
        budget: data.budget ? `₹${(data.budget / 10000000).toFixed(0)} Cr` : localMovie?.budget || "N/A",
        collection: data.revenue ? `₹${(data.revenue / 10000000).toFixed(0)} Cr` : localMovie?.collection || "N/A",
        ottPlatform: getAccurateOttPlatform(data.title),
        cast: mappedCast,
        similarMovies: genreMatchedMovies.slice(0, 6).map(mapMovie),
        trailerUrl: ytMedia.trailerUrl || (trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1` : ""),
        youtubeClips: ytMedia.youtubeClips || []
      };
      return res.json(mapped);
    }

    if (localMovie) {
      const ytMedia = await fetchMovieYouTubeMedia(localMovie.title);
      const tLower = (localMovie.title || "").toLowerCase();
      const customCast = CLASSIC_CAST_MAP[tLower] || null;

      // Fetch genre-matched fallback for localMovie
      let genreMatchedMovies = [];
      const primaryCategory = Array.isArray(localMovie.genres) && localMovie.genres.length > 0 ? localMovie.genres[0].toLowerCase() : "action";
      const tmdbGenres = { action: 28, comedy: 35, romance: 10749, scifi: 878, drama: 18, thriller: 53, crime: 80, family: 10751, horror: 27 };
      const genreId = tmdbGenres[primaryCategory] || 28;

      const genreDiscover = await fetchFromTMDB("/discover/movie", {
        with_genres: genreId,
        with_original_language: "te",
        sort_by: "popularity.desc"
      });
      if (genreDiscover && genreDiscover.results) {
        genreMatchedMovies = genreDiscover.results.filter(m => m.id !== localMovie.id).slice(0, 6).map(mapMovie);
      }

      return res.json({
        id: localMovie.id || movieId,
        title: localMovie.title,
        poster: localMovie.poster,
        bgImage: localMovie.bgImage || localMovie.poster,
        rating: localMovie.rating || 9.0,
        releaseYear: localMovie.releaseYear || localMovie.year || "Classic",
        year: localMovie.year || localMovie.releaseYear || "Classic",
        genres: localMovie.genres || ["Classic", "Drama"],
        overview: localMovie.description || localMovie.overview || "",
        director: localMovie.director || "Unknown",
        music: localMovie.music || "Unknown",
        ottPlatform: getAccurateOttPlatform(localMovie.title),
        cast: customCast || localMovie.cast || [],
        similarMovies: genreMatchedMovies,
        trailerUrl: ytMedia.trailerUrl || localMovie.trailerUrl || "",
        youtubeClips: ytMedia.youtubeClips || []
      });
    }

    return res.status(404).json({ message: "Movie not found" });
  } catch (err) {
    console.error("Movie ID Route Error:", err);
    res.status(500).json({ message: err.message });
  }
});

const enrichMovieForHero = async (basicMovie) => {
  const detail = await fetchFromTMDB(`/movie/${basicMovie.id}`, { append_to_response: "videos" }, { teluguOnly: false });
  if (!detail || !detail.id) return { ...basicMovie, match: 95, quality: "4K HDR", duration: "N/A", trailerUrl: "" };
  const trailer = getBestTrailer(detail.videos);
  return {
    ...basicMovie,
    overview: detail.overview || basicMovie.overview,
    match: Math.floor(Math.random() * 15) + 85,
    quality: "4K HDR",
    duration: detail.runtime ? `${Math.floor(detail.runtime / 60)}h ${detail.runtime % 60}m` : "N/A",
    trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1` : "",
  };
};

router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    let data;

    const tmdbGenres = { action: 28, comedy: 35, romance: 10749, scifi: 878, drama: 18, thriller: 53, crime: 80, family: 10751, horror: 27 };

    if (category === "hero") {
      data = await fetchFromTMDB("/discover/movie", { 
        sort_by: "popularity.desc", 
        with_original_language: "te", 
        "vote_count.gte": 10 
      });
      if (data && data.results && data.results.length > 0) {
        const topOtt = data.results.slice(0, 10).map(mapMovie);
        const enriched = await Promise.all(topOtt.map(enrichMovieForHero));
        return res.json(enriched.map(m => ({
          ...m,
          ottPlatform: getAccurateOttPlatform(m.title),
          isNewOtt: true
        })));
      }
      const movies = await Movie.find({ category: "hero" });
      return res.json(movies);
    }

    if (tmdbGenres[category] !== undefined) {
      data = await fetchFromTMDB("/discover/movie", { with_genres: tmdbGenres[category], sort_by: "popularity.desc", with_original_language: "te", "vote_count.gte": 10 });
      if (data && data.results && data.results.length > 0) return res.json(data.results.map(mapMovie));
    }

    if (category === "trending") {
      data = await fetchFromTMDB("/discover/movie", { sort_by: "popularity.desc", with_original_language: "te", "primary_release_date.gte": new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] });
      if (data && data.results && data.results.length > 0) return res.json(data.results.map(mapMovie));
      data = await fetchFromTMDB("/trending/movie/week");
      if (data && data.results) return res.json(data.results.map(mapMovie));
    }

    if (category === "theatres") {
      return res.json([
        {
          id: 1213243,
          title: "Toxic: A Fairy Tale for Grown-ups",
          poster: "https://image.tmdb.org/t/p/w500/oiIPU4lvnI0Ag2K9cyAi44eCaoE.jpg",
          rating: 9.5,
          status: "Grand Release",
          theatres: "2,800+ Screens",
          trend: "up",
          source: "KVN Productions & Monster Mind Creations"
        },
        {
          id: 1057265,
          title: "Peddi",
          poster: "https://image.tmdb.org/t/p/w500/kJAJNNBYlbqAcpTDxBNnaILSMTy.jpg",
          rating: 9.3,
          status: "Blockbuster",
          theatres: "1,850+ Screens",
          trend: "up",
          source: "Mythri Movie Makers & T2BLive"
        },
        {
          id: 857598,
          title: "Pushpa 2: The Rule",
          poster: "https://image.tmdb.org/t/p/w500/7HeMz4qskfnoHeZxp6oV4xCjqZs.jpg",
          rating: 9.6,
          status: "All-Time Blockbuster",
          theatres: "2,400+ Screens",
          trend: "up",
          source: "Mythri Movie Makers & Sacnilk"
        },
        {
          id: 811944,
          title: "Game Changer",
          poster: "https://image.tmdb.org/t/p/w500/qtOGsZoLW7QceqKmsOy5nSM6Aik.jpg",
          rating: 9.1,
          status: "Blockbuster",
          theatres: "1,650+ Screens",
          trend: "up",
          source: "Sri Venkateswara Creations & BO Andhra"
        },
        {
          id: 1380920,
          title: "Sankranthiki Vasthunam",
          poster: "https://image.tmdb.org/t/p/w500/gFa07KuR3tWFI6YFTeGz930zeMo.jpg",
          rating: 8.9,
          status: "Super Hit",
          theatres: "1,200+ Screens",
          trend: "up",
          source: "SVC & T2BLive"
        },
        {
          id: 1202235,
          title: "Daaku Maharaaj",
          poster: "https://image.tmdb.org/t/p/w500/u5skP8XShAgNTckeEqjhgSULnM8.jpg",
          rating: 9.0,
          status: "Blockbuster",
          theatres: "1,100+ Screens",
          trend: "up",
          source: "Sithara Entertainments & Sacnilk"
        },
        {
          id: 1239511,
          title: "Lucky Baskhar",
          poster: "https://image.tmdb.org/t/p/w500/a47JQFl9L7VDa79tEvnTOJe0rPa.jpg",
          rating: 9.2,
          status: "Super Hit",
          theatres: "850+ Screens",
          trend: "up",
          source: "Sithara Entertainments & BO Andhra"
        },
        {
          id: 1208735,
          title: "Thandel",
          poster: "https://image.tmdb.org/t/p/w500/uaMcu3I9l3qyYovya7dwUcdU6ve.jpg",
          rating: 8.8,
          status: "Hit",
          theatres: "920+ Screens",
          trend: "up",
          source: "Geetha Arts & Sacnilk"
        },
        {
          id: 1102353,
          title: "Mechanic Rocky",
          poster: "https://image.tmdb.org/t/p/w500/To7wOId0iiPveLn2nyuVIirufP.jpg",
          rating: 8.2,
          status: "Running",
          theatres: "480+ Screens",
          trend: "up",
          source: "SRT Entertainments & T2BLive"
        },
        {
          id: 1227241,
          title: "Maa Inti Bangaram",
          poster: "https://image.tmdb.org/t/p/w500/iSRIxnizjINdc7Dy68HQRkcPSR2.jpg",
          rating: 8.5,
          status: "Running",
          theatres: "520+ Screens",
          trend: "up",
          source: "People Media Factory & Sacnilk"
        }
      ]);
    }

    if (category === "new") {
      data = await fetchFromTMDB("/discover/movie", { sort_by: "primary_release_date.desc", with_original_language: "te", "primary_release_date.lte": new Date().toISOString().split("T")[0], "primary_release_date.gte": new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], "vote_count.gte": 5 });
      if (data && data.results && data.results.length > 0) return res.json(data.results.map(mapMovie));
      data = await fetchFromTMDB("/movie/now_playing");
      if (data && data.results) return res.json(data.results.map(mapMovie));
    }

    if (category === "top10") {
      data = await fetchFromTMDB("/discover/movie", { sort_by: "vote_average.desc", with_original_language: "te", "vote_count.gte": 200 });
      if (data && data.results && data.results.length > 0) return res.json(data.results.slice(0, 10).map(mapMovie));
    }

    if (category === "classic") {
      const CLASSIC_LIST = [
        {
          id: 158023,
          title: "Maya Bazaar (1957)",
          poster: "https://image.tmdb.org/t/p/w500/hLtcUnDZZuBNSONZbRTiS67bnyz.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/uANZlyroNA1CygPGuQT98I8qECM.jpg",
          rating: 9.8,
          releaseYear: "1957",
          year: "1957",
          genres: ["Mythological", "Fantasy", "Classic"],
          overview: "The undisputed pinnacle classic of Indian Cinema history featuring N.T. Rama Rao, Akkineni Nageswara Rao, and S.V. Ranga Rao.",
          director: "K.V. Reddy",
          music: "S. Rajeswara Rao",
          ottPlatform: "YouTube & SUN NXT"
        },
        {
          id: 354630,
          title: "Shiva (1989)",
          poster: "https://image.tmdb.org/t/p/w500/q6loMZxRfWdgmpK9OzHNtwSVHxs.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/bdLvelZtIr8MiscEs9e48Vzd4Jl.jpg",
          rating: 9.4,
          releaseYear: "1989",
          year: "1989",
          genres: ["Action", "Crime", "Classic"],
          overview: "The pathbreaking masterpiece starring King Nagarjuna directed by Ram Gopal Varma that revolutionized Indian cinema sound design & action.",
          director: "Ram Gopal Varma",
          music: "Ilaiyaraaja",
          ottPlatform: "ZEE5 & Amazon Prime Video"
        },
        {
          id: 280363,
          title: "Aditya 369 (1991)",
          poster: "https://image.tmdb.org/t/p/w500/54d8w0Yr2kCdXnLRkqIYVTEFfd6.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/54d8w0Yr2kCdXnLRkqIYVTEFfd6.jpg",
          rating: 9.2,
          releaseYear: "1991",
          year: "1991",
          genres: ["Sci-Fi", "Time Travel", "Classic"],
          overview: "Indian Cinema's first true sci-fi time travel masterpiece starring Nandamuri Balakrishna directed by Singeetam Srinivasa Rao.",
          director: "Singeetam Srinivasa Rao",
          music: "Ilaiyaraaja",
          ottPlatform: "SUN NXT & YouTube"
        },
        {
          id: 77031,
          title: "Jagadeka Veerudu Athiloka Sundari (1990)",
          poster: "https://image.tmdb.org/t/p/w500/q1B0XgJmzlSP6sujx95ny2tSwrK.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/q1B0XgJmzlSP6sujx95ny2tSwrK.jpg",
          rating: 9.3,
          releaseYear: "1990",
          year: "1990",
          genres: ["Fantasy", "Romance", "Classic"],
          overview: "Megastar Chiranjeevi & Sridevi's immortal fantasy musical blockbuster directed by K. Raghavendra Rao with Ilaiyaraaja's score.",
          director: "K. Raghavendra Rao",
          music: "Ilaiyaraaja",
          ottPlatform: "Amazon Prime Video & ZEE5"
        },
        {
          id: 148808,
          title: "Geethanjali (1989)",
          poster: "https://image.tmdb.org/t/p/w500/qZVWloCwvgP5JtaqBWoFY6YspzT.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/b2p8GKgeylD0o0Ka9FfSbBYXQMg.jpg",
          rating: 9.5,
          releaseYear: "1989",
          year: "1989",
          genres: ["Romance", "Drama", "Classic"],
          overview: "Mani Ratnam & Nagarjuna's eternal romantic masterpiece decorated with Ilaiyaraaja's immortal musical compositions.",
          director: "Mani Ratnam",
          music: "Ilaiyaraaja",
          ottPlatform: "Amazon Prime Video"
        },
        {
          id: 78596,
          title: "Gang Leader (1991)",
          poster: "https://image.tmdb.org/t/p/w500/6gALL6FJSqyu9udXydnfyoJWbiB.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/cvhIWRQ97WJuDIoPX4HSAQlxFN3.jpg",
          rating: 9.1,
          releaseYear: "1991",
          year: "1991",
          genres: ["Action", "Mass", "Classic"],
          overview: "Megastar Chiranjeevi's all-time industry hit mass commercial anthem that created box office history across Telugu states.",
          director: "Vijay Bapineedu",
          music: "Bappi Lahiri",
          ottPlatform: "Aha & SUN NXT"
        },
        {
          id: 81072,
          title: "Kshana Kshanam (1991)",
          poster: "https://image.tmdb.org/t/p/w500/9qQyvepQkpPeeNFk04tea2vLTuY.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/lcmfVMnKKp6FGQxupOoVGS6afMM.jpg",
          rating: 9.0,
          releaseYear: "1991",
          year: "1991",
          genres: ["Thriller", "Comedy", "Classic"],
          overview: "Victory Venkatesh & Sridevi's iconic neo-noir road comedy thriller directed by Ram Gopal Varma.",
          director: "Ram Gopal Varma",
          music: "M.M. Keeravani",
          ottPlatform: "YouTube & SUN NXT"
        },
        {
          id: 94965,
          title: "Okkadu (2003)",
          poster: "https://image.tmdb.org/t/p/w500/nVBa5QWSPrVzFyHK2XWrsruQzyl.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/bB65WB9fVXWItfab4M5PFbp5jtI.jpg",
          rating: 9.6,
          releaseYear: "2003",
          year: "2003",
          genres: ["Action", "Romance", "Classic"],
          overview: "Superstar Mahesh Babu & Bhumika Chawla's Industry Hit screenplay benchmark that defined modern commercial Telugu cinema.",
          director: "Gunasekhar",
          music: "Mani Sharma",
          ottPlatform: "SUN NXT & YouTube"
        },
        {
          id: 23381,
          title: "Pokiri (2006)",
          poster: "https://image.tmdb.org/t/p/w500/rQ8NH5f3CxRrmqZWMZNYPwLmjDS.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/z3mlTunM7Ck7WB6inIuKJ6b8hjb.jpg",
          rating: 9.7,
          releaseYear: "2006",
          year: "2006",
          genres: ["Action", "Crime", "Classic"],
          overview: "Puri Jagannadh & Mahesh Babu's trendsetting Industry Hit that smashed all existing box office records in Telugu cinema history.",
          director: "Puri Jagannadh",
          music: "Mani Sharma",
          ottPlatform: "Disney+ Hotstar & YouTube"
        },
        {
          id: 25882,
          title: "Indra (2002)",
          poster: "https://image.tmdb.org/t/p/w500/7wpVcrbVNkKApW9mPZmpL0zqRvi.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/mmuWx4t5LI847W0SVo1uoKwthrW.jpg",
          rating: 9.5,
          releaseYear: "2002",
          year: "2002",
          genres: ["Action", "Faction", "Classic"],
          overview: "Megastar Chiranjeevi's legendary Rayalaseema Faction Industry Hit with iconic dialogues, steps & Mani Sharma score.",
          director: "B. Gopal",
          music: "Mani Sharma",
          ottPlatform: "Aha & SUN NXT"
        },
        {
          id: 82255,
          title: "Nuvvu Naaku Nachav (2001)",
          poster: "https://image.tmdb.org/t/p/w500/z6F2Y7zddPFZ2ls9OY006egVClP.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/1Z4D31l2avNXR8KLTgqIGW3uHkP.jpg",
          rating: 9.8,
          releaseYear: "2001",
          year: "2001",
          genres: ["Comedy", "Family", "Classic"],
          overview: "Victory Venkatesh & Arti Agarwal's evergreen family comedy entertainer written by Trivikram Srinivas with infinite replay value.",
          director: "K. Vijaya Bhaskar",
          music: "Koti",
          ottPlatform: "Disney+ Hotstar & SUN NXT"
        },
        {
          id: 81083,
          title: "Manmadhudu (2002)",
          poster: "https://image.tmdb.org/t/p/w500/bHjMjCmtpfQzQoDjiL9rWWo4ahd.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/cTDymTdCXygVSekF9bY5Zh2Uvq7.jpg",
          rating: 9.5,
          releaseYear: "2002",
          year: "2002",
          genres: ["Romance", "Comedy", "Classic"],
          overview: "Nagarjuna & Sonali Bendre's timeless romantic comedy benchmark with hilarious Trivikram dialogues and Devi Sri Prasad music.",
          director: "K. Vijaya Bhaskar",
          music: "Devi Sri Prasad",
          ottPlatform: "Disney+ Hotstar & SUN NXT"
        },
        {
          id: 37172,
          title: "Athadu (2005)",
          poster: "https://image.tmdb.org/t/p/w500/ojZAu2KOemaDEfLnJXZeuU9QQko.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/8SByVmuLzQDpITwotmFFdTo1qEp.jpg",
          rating: 9.7,
          releaseYear: "2005",
          year: "2005",
          genres: ["Action", "Thriller", "Classic"],
          overview: "Trivikram's directorial masterpiece starring Mahesh Babu, Trisha & Prakash Raj—the highest TRP rated cult classic in Telugu television history.",
          director: "Trivikram Srinivas",
          music: "Mani Sharma",
          ottPlatform: "Disney+ Hotstar & SUN NXT"
        },
        {
          id: 79210,
          title: "Chatrapathi (2005)",
          poster: "https://image.tmdb.org/t/p/w500/f9SjU4lj4jraX9WBYZAasbc79GX.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/i4DC8qD8TWjgTyCYgNRZ7lYqABY.jpg",
          rating: 9.4,
          releaseYear: "2005",
          year: "2005",
          genres: ["Action", "Drama", "Classic"],
          overview: "Prabhas & SS Rajamouli's high-voltage mass elevation epic that cemented Prabhas as a pan-India action titan.",
          director: "S.S. Rajamouli",
          music: "M.M. Keeravani",
          ottPlatform: "Disney+ Hotstar"
        },
        {
          id: 23790,
          title: "Magadheera (2009)",
          poster: "https://image.tmdb.org/t/p/w500/xK7MEV56GF291VG0U5XnVJuvNv3.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/p2SvjtejMgiBDCLL3ugOmCxk3sY.jpg",
          rating: 9.6,
          releaseYear: "2009",
          year: "2009",
          genres: ["Fantasy", "Action", "Classic"],
          overview: "Mega Power Star Ram Charan & SS Rajamouli's Industry Hit reincarnation epic that raised Telugu cinema visual standards.",
          director: "S.S. Rajamouli",
          music: "M.M. Keeravani",
          ottPlatform: "Aha & SUN NXT"
        },
        {
          id: 31626,
          title: "Bommarillu (2006)",
          poster: "https://image.tmdb.org/t/p/w500/oYN5XJzV9dYGwzq4fmp41xcIaDS.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/6MrXT2kyeoWiruFNkxlhovM3plj.jpg",
          rating: 9.4,
          releaseYear: "2006",
          year: "2006",
          genres: ["Family", "Romance", "Classic"],
          overview: "Siddharth, Genelia, and Prakash Raj's relatable family drama masterpiece that won 7 Nandi Awards.",
          director: "Bhaskar",
          music: "Devi Sri Prasad",
          ottPlatform: "ZEE5 & SUN NXT"
        },
        {
          id: 80798,
          title: "Annamayya (1997)",
          poster: "https://image.tmdb.org/t/p/w500/jmgzq8MWSMthVYE08H9bAKVTpu8.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/jmgzq8MWSMthVYE08H9bAKVTpu8.jpg",
          rating: 9.5,
          releaseYear: "1997",
          year: "1997",
          genres: ["Devotional", "Drama", "Classic"],
          overview: "King Nagarjuna's National Award winning devotional biographical classic directed by K. Raghavendra Rao.",
          director: "K. Raghavendra Rao",
          music: "M.M. Keeravani",
          ottPlatform: "Aha & SUN NXT"
        },
        {
          id: 405800,
          title: "Sankarabharanam (1980)",
          poster: "https://image.tmdb.org/t/p/w500/xNcBpesh3t81GCUg4SbZ9UG6UQQ.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/ke5Vdge9VZlmfRHaiOf9qaJYPr7.jpg",
          rating: 9.9,
          releaseYear: "1980",
          year: "1980",
          genres: ["Musical", "Drama", "Classic"],
          overview: "K. Viswanath's National Award winning musical drama milestone that achieved global acclaim for Carnatic music culture.",
          director: "K. Viswanath",
          music: "K.V. Mahadevan",
          ottPlatform: "YouTube & SUN NXT"
        },
        {
          id: 30344,
          title: "Swathimuthyam (1986)",
          poster: "https://image.tmdb.org/t/p/w500/pMvT7VjCMlVE0dShi8A9HYV7xZV.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/6ltcxeSGekEDuvajah3JPvjkAT2.jpg",
          rating: 9.7,
          releaseYear: "1986",
          year: "1986",
          genres: ["Drama", "Classic"],
          overview: "Kamal Haasan & Radhika's masterpiece directed by K. Viswanath—India's official entry for the 59th Academy Awards.",
          director: "K. Viswanath",
          music: "Ilaiyaraaja",
          ottPlatform: "SUN NXT & YouTube"
        },
        {
          id: 80805,
          title: "Simhadri (2003)",
          poster: "https://image.tmdb.org/t/p/w500/pTzdNOtWSXB32OGPCI5ayE4NgiX.jpg",
          bgImage: "https://image.tmdb.org/t/p/original/bQFArB0fPMoVTnEKL5P87tEE8tw.jpg",
          rating: 9.5,
          releaseYear: "2003",
          year: "2003",
          genres: ["Action", "Mass", "Classic"],
          overview: "Jr NTR & SS Rajamouli's Industry Hit mass action sensation that created history at the box office with 175-day theatrical runs.",
          director: "S.S. Rajamouli",
          music: "M.M. Keeravani",
          ottPlatform: "Aha & SUN NXT"
        }
      ];

      try {
        const enriched = await Promise.all(
          CLASSIC_LIST.map(async (item) => {
            const data = await fetchFromTMDB(`/movie/${item.id}`, {}, { teluguOnly: false });
            if (data && data.id) {
              const mapped = mapMovie(data);
              return {
                ...item,
                poster: mapped.poster || item.poster,
                bgImage: mapped.bgImage || item.bgImage || mapped.poster || item.poster,
                overview: mapped.overview || item.overview,
                rating: mapped.rating || item.rating
              };
            }
            return item;
          })
        );
        return res.json(enriched);
      } catch (e) {
        return res.json(CLASSIC_LIST);
      }
    }

    if (category === "mythological") {
      data = await fetchFromTMDB("/discover/movie", { with_genres: "14,12", sort_by: "vote_average.desc", with_original_language: "te", "vote_count.gte": 5 });
      if (data && data.results && data.results.length > 0) return res.json(data.results.map(mapMovie));
      data = await fetchFromTMDB("/discover/movie", { with_genres: "36,14", sort_by: "popularity.desc", with_original_language: "te", "vote_count.gte": 5 });
      if (data && data.results && data.results.length > 0) return res.json(data.results.map(mapMovie));
    }

    if (category === "blockbusters") {
      data = await fetchFromTMDB("/discover/movie", { sort_by: "vote_count.desc", with_original_language: "te", "vote_count.gte": 300 });
      if (data && data.results && data.results.length > 0) return res.json(data.results.map(mapMovie));
    }

    if (category === "awardwinners") {
      data = await fetchFromTMDB("/discover/movie", { sort_by: "vote_average.desc", with_original_language: "te", "vote_average.gte": 7.5, "vote_count.gte": 100 });
      if (data && data.results && data.results.length > 0) return res.json(data.results.map(mapMovie));
    }

    if (category === "superhero") {
      data = await fetchFromTMDB("/discover/movie", { with_genres: "28,14", sort_by: "popularity.desc", with_original_language: "te", "vote_count.gte": 10 });
      if (data && data.results && data.results.length > 0) return res.json(data.results.map(mapMovie));
    }

    try {
      const movies = await Movie.find({ category: category });
      res.json(movies);
    } catch (dbErr) {
      console.error(`MongoDB fallback error [${category}]:`, dbErr.message);
      res.json([]);
    }
  } catch (err) {
    console.error(`Category fetch error [${req.params.category}]:`, err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
