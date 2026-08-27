import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchUserMemes, 
  submitUserMeme, 
  likeUserMeme,
  fetchMemeShorts,
  fetchCuratedInstagram
} from '../../services/api';
import './ViralMemes.css';

const ViralMemes = ({ redditMemes = [] }) => {
  const { user, token } = useAuth();
  
  const [userMemes, setUserMemes] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [igPosts, setIgPosts] = useState([]);
  
  const [showSubmit, setShowSubmit] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [uMemes, yShorts, iPosts] = await Promise.all([
        fetchUserMemes(),
        fetchMemeShorts(),
        fetchCuratedInstagram()
      ]);
      setUserMemes(uMemes);
      setShorts(yShorts);
      setIgPosts(iPosts);
      
      // Load IG embed script dynamically if there are posts
      if (iPosts.length > 0 && !window.instgrm) {
        const script = document.createElement('script');
        script.src = "//www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
      } else if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
    };
    loadData();
  }, []);

  const handleMemeSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setSubmitError('Must be logged in to submit a meme.');
    if (!title || !imageUrl) return setSubmitError('Please provide a title and image URL.');
    
    setSubmitError('');
    const newMeme = await submitUserMeme(title, imageUrl, token);
    
    if (newMeme && !newMeme.message) {
      setUserMemes([newMeme, ...userMemes]);
      setShowSubmit(false);
      setTitle('');
      setImageUrl('');
    } else {
      setSubmitError(newMeme.message || 'Failed to submit meme.');
    }
  };

  const handleLike = async (memeId) => {
    if (!user) return alert('Must be logged in to like.');
    
    const updated = await likeUserMeme(memeId, token);
    if (updated && !updated.message) {
      setUserMemes(prev => prev.map(m => m._id === updated._id ? updated : m));
    }
  };

  return (
    <div className="viral-memes-container">
      
      {/* 1. YouTube Shorts */}
      {shorts.length > 0 && (
        <div className="memes-section">
          <h3 className="section-title">📱 Trending Shorts</h3>
          <div className="shorts-carousel">
            {shorts.map(short => (
              <a key={short.id} href={short.url} target="_blank" rel="noopener noreferrer" className="short-card">
                <div className="short-thumbnail">
                  <img src={short.thumbnail} alt={short.title} />
                  <div className="short-overlay">▶</div>
                </div>
                <p className="short-title">{short.title}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 2. User & Reddit Memes Mixed or Side-by-Side */}
      <div className="memes-grid-layout">
        
        {/* User Memes */}
        <div className="memes-column">
          <div className="column-header">
            <h3 className="section-title">👥 Community Memes</h3>
            <button className="submit-btn" onClick={() => setShowSubmit(!showSubmit)}>
              {showSubmit ? 'Cancel' : '+ Submit Meme'}
            </button>
          </div>
          
          {showSubmit && (
            <form onSubmit={handleMemeSubmit} className="meme-submit-form glass-panel">
              <h4>Submit a URL</h4>
              {submitError && <p className="error">{submitError}</p>}
              <input 
                type="text" 
                placeholder="Meme Title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
              />
              <input 
                type="url" 
                placeholder="Image URL (jpg/png/gif)" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <button type="submit" className="action-btn">Post Meme</button>
            </form>
          )}

          <div className="masonry-grid">
            {userMemes.map(meme => {
              const hasLiked = user && meme.likes.includes(user._id);
              return (
                <div key={meme._id} className="meme-card animated-slide">
                  <img src={meme.imageUrl} alt={meme.title} />
                  <div className="meme-overlay">
                    <p>{meme.title}</p>
                    <div className="meme-meta">
                      <span>By {meme.submittedBy?.name || 'User'}</span>
                      <button 
                        className={`like-btn ${hasLiked ? 'liked' : ''}`}
                        onClick={() => handleLike(meme._id)}
                      >
                        ❤️ {meme.likes.length}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reddit Memes */}
        <div className="memes-column">
          <h3 className="section-title">👽 r/Tollywood Memes</h3>
          <div className="masonry-grid">
            {redditMemes.map(meme => (
              <div key={meme.id} className="meme-card animated-slide">
                <img src={meme.url} alt="Reddit Meme" />
                <div className="meme-overlay">
                  <p>{meme.title}</p>
                  <a href={meme.permalink} target="_blank" rel="noopener noreferrer" className="reddit-link">
                    View on Reddit ({meme.ups} upvotes)
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Instagram Embeds */}
      {igPosts.length > 0 && (
        <div className="memes-section ig-section">
          <h3 className="section-title">📸 Curated Instagram Memes</h3>
          <div className="ig-grid">
            {igPosts.map(post => (
              <div key={post.id} className="ig-card">
                <blockquote 
                  className="instagram-media" 
                  data-instgrm-permalink={`https://www.instagram.com/p/${post.shortcode}/`} 
                  data-instgrm-version="14"
                ></blockquote>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ViralMemes;
