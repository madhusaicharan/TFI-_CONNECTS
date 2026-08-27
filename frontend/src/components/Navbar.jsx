import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/',          label: 'Home',       exact: true  },
  { to: '/movies',    label: 'Movies',     exact: false },
  { to: '/trending',  label: 'Trending',   exact: false },
  { to: '/favourites',label: 'Favourites', exact: false },
  { to: '/box-office',label: 'Box Office', exact: false },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (link) => {
    if (link.exact) return location.pathname === link.to;
    return location.pathname.startsWith(link.to);
  };

  const handleSearchClick = () => navigate('/search');

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className={`netflix-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-left">
          <Link to="/" className="nav-logo" aria-label="TFI Connects Home">
            <span className="logo-tfi">TFI</span>
            <span className="logo-connects">_CONNECTS</span>
          </Link>
          <ul className="nav-links">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`nav-link ${isActive(link) ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="nav-right">
          <button
            className="search-icon"
            onClick={handleSearchClick}
            aria-label="Search movies"
          >
            <Search size={20} />
          </button>
          <NotificationDropdown />

          {isAuthenticated ? (
            <div className="profile-container">
              <div className="profile-dropdown">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'Guest')}&backgroundColor=b6e3f4`}
                  alt={user?.name || 'User Profile'}
                  className="avatar-img"
                />
                <span className="caret" aria-hidden="true">▾</span>
              </div>
              <div className="dropdown-menu" role="menu">
                <div className="dropdown-arrow" />
                <div className="account-info">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'Guest')}&backgroundColor=b6e3f4`}
                    alt="Profile"
                    className="dropdown-avatar"
                  />
                  <div className="account-text">
                    <span className="account-name">{user?.name || 'Guest'}</span>
                    <span className="account-email">{user?.email || ''}</span>
                  </div>
                </div>
                <hr className="dropdown-divider" />
                <Link to="/favourites" className="dropdown-item" role="menuitem">My Favourites</Link>
                <Link to="/records"   className="dropdown-item" role="menuitem">Collection Records</Link>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item sign-out"
                  onClick={handleSignOut}
                  role="menuitem"
                >
                  Sign out of TFI_CONNECTS
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="nav-signin-btn">Sign In</Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile slide-out menu */}
      {mobileOpen && (
        <div className="nav-mobile-menu" role="navigation" aria-label="Mobile navigation">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`nav-mobile-link ${isActive(link) ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default Navbar;
