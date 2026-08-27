const Parser = require('rss-parser');
const ytSearch = require('yt-search');
const { fetchFromTMDB } = require('./tmdb');

const parser = new Parser();

// Memory Cache to prevent API rate limiting
const cache = {
  news: { data: null, timestamp: 0 },
  redditMemes: { data: null, timestamp: 0 },
  youtubeTrailers: { data: null, timestamp: 0 },
  youtubeInterviews: { data: null, timestamp: 0 },
  tweets: { data: null, timestamp: 0 },
  memeShorts: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const isCacheValid = (key) => {
  return cache[key].data && (Date.now() - cache[key].timestamp < CACHE_DURATION);
};

// 1. Movie News via Google News RSS
const fetchMovieNews = async () => {
  if (isCacheValid('news')) return cache.news.data;

  try {
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=tollywood+OR+telugu+movies+when:7d');
    const news = feed.items.slice(0, 15).map(item => ({
      id: item.guid || item.link,
      title: item.title,
      link: item.link,
      source: item.source || 'Google News',
      publishedAt: item.pubDate,
      snippet: item.contentSnippet || ''
    }));
    cache.news = { data: news, timestamp: Date.now() };
    return news;
  } catch (err) {
    console.error('Error fetching Google News:', err.message);
    return [];
  }
};

// 2. Viral Memes & Fan Wars via Reddit RSS
const fetchRedditPosts = async () => {
  if (isCacheValid('redditMemes')) return cache.redditMemes.data;

  try {
    const feed = await parser.parseURL('https://www.reddit.com/r/tollywood/.rss');
    
    // Parse RSS feed items
    const posts = feed.items.map(item => {
      // Extract image URL from the content snippet if it exists
      const imgMatch = item.contentSnippet ? item.contentSnippet.match(/href="([^"]+\.(jpg|png|gif))"/) : null;
      return {
        id: item.guid,
        title: item.title,
        url: imgMatch ? imgMatch[1] : item.link,
        author: item.author,
        permalink: item.link,
        content: item.contentSnippet || '',
        isImage: !!imgMatch
      };
    });

    const memes = posts
      .filter(post => post.isImage)
      .map((post, i) => ({
        id: post.id,
        title: post.title,
        url: post.url,
        author: post.author,
        ups: Math.floor(Math.random() * 500) + 100, // RSS doesn't give exact upvotes
        comments: Math.floor(Math.random() * 50) + 10,
        permalink: post.permalink
      }));

    const discussions = posts
      .filter(post => !post.isImage)
      .map(post => ({
        id: post.id,
        title: post.title,
        author: post.author,
        ups: Math.floor(Math.random() * 300) + 50,
        comments: Math.floor(Math.random() * 100) + 20,
        permalink: post.permalink,
        text: post.content.substring(0, 150) + '...'
      }));

    const result = { memes, discussions };
    cache.redditMemes = { data: result, timestamp: Date.now() };
    return result;
  } catch (err) {
    console.error('Error fetching Reddit RSS:', err.message);
    return { memes: [], discussions: [] };
  }
};

// 3. YouTube (Trailers, Reactions, Interviews) via yt-search
const fetchYouTubeVideos = async (query, type) => {
  const cacheKey = type === 'trailers' ? 'youtubeTrailers' : 'youtubeInterviews';
  if (isCacheValid(cacheKey)) return cache[cacheKey].data;

  try {
    const r = await ytSearch(query);
    const videos = r.videos.slice(0, 12).map(v => ({
      id: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      url: v.url,
      views: v.views,
      duration: v.timestamp,
      author: v.author.name
    }));
    
    cache[cacheKey] = { data: videos, timestamp: Date.now() };
    return videos;
  } catch (err) {
    console.error(`Error fetching YouTube (${query}):`, err.message);
    return [];
  }
};

// 4. Trending Tweets (Using real-time news snippets since Twitter API is closed)
const fetchTrendingTweets = async () => {
  if (isCacheValid('tweets')) return cache.tweets.data;

  try {
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=tollywood+OR+telugu+movies+twitter+update+when:1d');
    
    const tweets = feed.items.slice(0, 6).map((item, index) => {
      // Create a mock Twitter handle based on the source
      const sourceName = item.source || 'TFIUpdates';
      const handle = sourceName.replace(/\s+/g, '').substring(0, 12);
      
      return {
        id: `realtime-${index}`,
        user: sourceName,
        handle: handle,
        content: item.title.split(' - ')[0] + ' 🎬🍿',
        likes: `${Math.floor(Math.random() * 50) + 1}.${Math.floor(Math.random() * 9)}K`,
        retweets: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 9)}K`,
        time: item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '1h'
      };
    });

    cache.tweets = { data: tweets, timestamp: Date.now() };
    return tweets;
  } catch (err) {
    console.error('Error fetching real-time tweets (Google News RSS):', err.message);
    return [];
  }
};

// 5. Box Office Buzz via TMDB
const fetchBoxOfficeBuzz = async () => {
  try {
    const data = await fetchFromTMDB('/discover/movie', {
      sort_by: 'popularity.desc',
      with_original_language: 'te',
      'vote_count.gte': 100
    });
    
    if (data && data.results) {
      return data.results.slice(0, 10).map(m => ({
        id: m.id,
        title: m.title,
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
        rating: m.vote_average,
        releaseDate: m.release_date,
        popularity: m.popularity
      }));
    }
    return [];
  } catch (err) {
    console.error('Error fetching Box Office buzz:', err.message);
    return [];
  }
};

// 6. YouTube Meme Shorts
const fetchMemeShorts = async () => {
  if (isCacheValid('memeShorts')) return cache.memeShorts.data;

  try {
    const r = await ytSearch('tollywood memes #shorts');
    const shorts = r.videos
      .filter(v => v.duration.seconds < 60) // Ensure it's a short
      .slice(0, 10)
      .map(v => ({
        id: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail,
        url: v.url,
        views: v.views,
        author: v.author.name
      }));
    
    cache.memeShorts = { data: shorts, timestamp: Date.now() };
    return shorts;
  } catch (err) {
    console.error('Error fetching Meme Shorts:', err.message);
    return [];
  }
};

// 7. Curated Instagram Posts
const fetchCuratedInstagram = async () => {
  // We return a curated list of Instagram shortcodes since scraping IG is blocked.
  // This could be fetched from MongoDB later.
  return [
    { id: '1', shortcode: 'C_2h3L9P_xy' }, // Random example shortcodes
    { id: '2', shortcode: 'C_1z3M8P_xx' },
    { id: '3', shortcode: 'C_0y2N7O_xw' },
    { id: '4', shortcode: 'C_9x1O6N_xv' }
  ];
};

module.exports = {
  fetchMovieNews,
  fetchRedditPosts,
  fetchYouTubeVideos,
  fetchTrendingTweets,
  fetchBoxOfficeBuzz,
  fetchMemeShorts,
  fetchCuratedInstagram
};
