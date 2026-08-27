import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useFavorites } from '../hooks/useFavorites';
import { Play } from 'lucide-react';
import './Favourites.css';

const Favourites = () => {
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  return (
    <div className="favourites-page">
      <Navbar />
      
      <div className="favourites-container fade-in">
        <h1 className="favourites-title">My Favourites</h1>
        
        {favorites.length === 0 ? (
          <div className="empty-favourites">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=ThugLife&accessories=sunglasses" 
              alt="Thug Life" 
              className="thug-bitmoji"
            />
            <h2>Oops, no favourites!</h2>
            <p>You haven't added any movies to your favourites yet. Go explore some blockbusters!</p>
            <button className="btn-explore" onClick={() => navigate('/')}>Explore Movies</button>
          </div>
        ) : (
          <div className="favourites-grid">
            {favorites.map(movie => (
              <div key={movie.id} className="fav-card" onClick={() => navigate(`/movie/${movie.id}`)}>
                <img src={movie.poster} alt={movie.title} className="fav-poster" />
                <div className="fav-overlay">
                  <Play size={40} className="fav-play-icon" />
                  <span className="fav-title">{movie.title}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Favourites;
