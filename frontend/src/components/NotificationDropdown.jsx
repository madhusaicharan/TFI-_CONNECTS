import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import './NotificationDropdown.css';

const API_URL = 'http://localhost:5000/api';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (notifications.length > 0) return; // Cache after first load
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/movies/category/new`);
      if (res.ok) {
        const movies = await res.json();
        const notifs = movies.slice(0, 8).map(movie => ({
          id: movie.id,
          title: movie.title,
          poster: movie.poster,
          message: `${movie.title} is now playing in theatres!`,
          time: 'Recently'
        }));
        setNotifications(notifs);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen) loadNotifications();
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <div className="notification-icon" onClick={handleToggle}>
        <Bell size={20} />
        {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
      </div>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notif-arrow"></div>
          <div className="notif-header">
            <h4>Notifications</h4>
          </div>
          <div className="notif-list">
            {loading && <div className="notif-loading">Loading...</div>}
            {!loading && notifications.length === 0 && (
              <div className="notif-empty">No new notifications</div>
            )}
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className="notif-item"
                onClick={() => {
                  navigate(`/movie/${notif.id}`);
                  setIsOpen(false);
                }}
              >
                <img src={notif.poster} alt={notif.title} className="notif-poster" />
                <div className="notif-content">
                  <p className="notif-message">{notif.message}</p>
                  <span className="notif-time">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
