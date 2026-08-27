import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import TrendingSocial from '../components/TrendingSocial';
import { RedditDiscussionsFeed } from '../components/ui/testimonial-v2';
import NewsFeed from '../components/trending/NewsFeed';
import VideoCarousel from '../components/trending/VideoCarousel';
import CommunityPolls from '../components/trending/CommunityPolls';
import BoxOfficeBuzz from '../components/trending/BoxOfficeBuzz';
import { 
  fetchTrendingSocial, 
  fetchMovieNews, 
  fetchRedditMemes, 
  fetchYouTubeVideos, 
  fetchTrendingTweets, 
  fetchBoxOfficeBuzz, 
  fetchPolls 
} from '../services/api';
import './TrendingPage.css';

const TrendingPage = () => {
  const [activeTab, setActiveTab] = useState('social');
  
  // Data states
  const [socialData, setSocialData] = useState(null); 
  const [news, setNews] = useState([]);
  const [redditData, setRedditData] = useState({ memes: [], discussions: [] });
  const [trailers, setTrailers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [buzz, setBuzz] = useState([]);
  const [polls, setPolls] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          newsRes,
          redditRes,
          trailersRes,
          interviewsRes,
          tweetsRes,
          buzzRes,
          pollsRes
        ] = await Promise.all([
          fetchMovieNews(),
          fetchRedditMemes(),
          fetchYouTubeVideos('trailers'),
          fetchYouTubeVideos('interviews'),
          fetchTrendingTweets(),
          fetchBoxOfficeBuzz(),
          fetchPolls()
        ]);

        setNews(newsRes);
        setRedditData(redditRes);
        setTrailers(trailersRes);
        setInterviews(interviewsRes);
        setTweets(tweetsRes);
        setBuzz(buzzRes);
        setPolls(pollsRes);
        
        // Pass to legacy component
        setSocialData({
          tweets: tweetsRes,
          memes: [] // Memes moved to new tab
        });
        
      } catch (err) {
        console.error('Failed to load trending data:', err);
        setError('Failed to load live trending feeds. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleVoteSuccess = (updatedPoll) => {
    setPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'social':
        return (
          <div className="fade-in">
            <TrendingSocial socialData={socialData} />
            <RedditDiscussionsFeed discussions={redditData?.discussions} />
          </div>
        );
      
      case 'news':
        return (
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
            <div>
              <h2 className="section-title">📰 Latest Movie News</h2>
              <NewsFeed news={news} />
            </div>
            <div>
              <h2 className="section-title">📈 Box Office Buzz</h2>
              <BoxOfficeBuzz buzzMovies={buzz} />
            </div>
          </div>
        );
      
      case 'videos':
        return (
          <div className="fade-in">
            <VideoCarousel title="🎬 Trending Trailers & Teasers" videos={trailers} />
            <VideoCarousel title="🎤 Latest Celebrity Interviews" videos={interviews} />
          </div>
        );
        
      case 'community':
        return (
          <div className="fade-in">
            <h2 className="section-title">🗳️ Community Polls</h2>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <CommunityPolls polls={polls} onVoteSuccess={handleVoteSuccess} />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="trending-page">
        <Navbar />
        <LoadingSpinner message="Fetching live data from across the web..." />
      </div>
    );
  }

  return (
    <div className="trending-page">
      <Navbar />
      
      <div className="trending-container fade-in">
        <div className="trending-header">
          <h1 className="trending-title">Live Trending <span>Feed</span></h1>
          <p className="trending-subtitle">Real-time updates from Twitter, Reddit, YouTube, Google News & TMDB</p>
          
          <div className="trending-tabs">
            <button 
              className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
              onClick={() => setActiveTab('social')}
            >
              Social Feed
            </button>
            <button 
              className={`tab-btn ${activeTab === 'news' ? 'active' : ''}`}
              onClick={() => setActiveTab('news')}
            >
              News & Buzz
            </button>
            <button 
              className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveTab('videos')}
            >
              Videos
            </button>
            <button 
              className={`tab-btn ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              Community Polls
            </button>
          </div>
        </div>
        
        {error ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#e50914', fontSize: '1.2rem', marginBottom: '20px' }}>{error}</p>
            <button onClick={() => window.location.reload()} className="tab-btn active">Try Again</button>
          </div>
        ) : (
          <div className="tab-content">
            {renderTabContent()}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default TrendingPage;
