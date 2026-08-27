import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// ── Lazy-loaded pages (code splitting per route) ──────────────────────────────
const LandingPage    = lazy(() => import('./pages/LandingPage'));
const Home           = lazy(() => import('./pages/Home'));
const SearchPage     = lazy(() => import('./pages/Search'));
const MoviePage      = lazy(() => import('./pages/MoviePage'));
const Favourites     = lazy(() => import('./pages/Favourites'));
const BoxOfficePage  = lazy(() => import('./pages/BoxOfficePage'));
const TrendingPage   = lazy(() => import('./pages/TrendingPage'));
const MoviesPage     = lazy(() => import('./pages/MoviesPage'));
const RecordsPage    = lazy(() => import('./pages/RecordsPage'));
const CelebrityPage  = lazy(() => import('./pages/CelebrityPage'));
const CategoryPage   = lazy(() => import('./pages/CategoryPage'));
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'));

// ── Route-level loading fallback ──────────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#0a0a0a',
  }}>
    <div style={{
      width: 48,
      height: 48,
      border: '3px solid rgba(229,9,20,0.2)',
      borderTopColor: '#e50914',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  const [showLanding, setShowLanding] = useState(true);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              {showLanding && (
                <LandingPage onComplete={() => setShowLanding(false)} />
              )}

              <div className={`app-container ${showLanding ? 'hidden' : ''}`}>
                <div className="global-app-ambient-bg" />
                <ErrorBoundary>
                  <Routes>
                    <Route path="/"               element={<Home />} />
                    <Route path="/login"          element={<LoginPage />} />
                    <Route path="/verify-email"   element={<LoginPage />} />
                    <Route path="/search"         element={<SearchPage />} />
                    <Route path="/movie/:id"      element={<MoviePage />} />
                    <Route path="/favourites"     element={<Favourites />} />
                    <Route path="/movies"         element={<MoviesPage />} />
                    <Route path="/trending"       element={<TrendingPage />} />
                    <Route path="/box-office"     element={<BoxOfficePage />} />
                    <Route path="/boxoffice"      element={<BoxOfficePage />} />
                    <Route path="/records"        element={<RecordsPage />} />
                    <Route path="/celebrity/:id"          element={<CelebrityPage />} />
                    <Route path="/category/:categoryKey"  element={<CategoryPage />} />
                    {/* Catch-all 404 */}
                    <Route path="*"              element={<NotFoundPage />} />
                  </Routes>
                </ErrorBoundary>
              </div>
            </Suspense>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
