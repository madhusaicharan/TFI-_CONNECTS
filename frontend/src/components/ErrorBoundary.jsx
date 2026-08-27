import React from 'react';

/**
 * ErrorBoundary
 * ─────────────────────────────────────────────────────────────────────────────
 * Class-based React error boundary.
 * Wrap around any component tree to catch render-time JS errors gracefully.
 *
 * Usage:
 *   <ErrorBoundary fallback={<p>Something broke!</p>}>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to an error tracking service (e.g., Sentry) in production
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">🎬</div>
            <h2>Something went wrong</h2>
            <p>We ran into an unexpected error. Don't worry — your session is safe.</p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error details (dev only)</summary>
                <pre>{this.state.error.toString()}</pre>
              </details>
            )}
            <button
              className="error-boundary-btn"
              onClick={this.handleReset}
            >
              Try Again
            </button>
            <a href="/" className="error-boundary-home">← Back to Home</a>
          </div>

          <style>{`
            .error-boundary-fallback {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 60vh;
              padding: 2rem;
              background: #0a0a0a;
              color: #fff;
              font-family: 'Inter', sans-serif;
              text-align: center;
            }
            .error-boundary-content {
              max-width: 480px;
            }
            .error-boundary-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            .error-boundary-content h2 {
              font-size: 1.75rem;
              font-weight: 700;
              margin-bottom: 0.5rem;
              color: #e50914;
            }
            .error-boundary-content p {
              color: #aaa;
              margin-bottom: 1.5rem;
              line-height: 1.6;
            }
            .error-boundary-details {
              margin-bottom: 1.5rem;
              text-align: left;
              background: #1a1a1a;
              border-radius: 8px;
              padding: 1rem;
              font-size: 0.75rem;
              color: #ff6b6b;
              overflow: auto;
              max-height: 200px;
            }
            .error-boundary-btn {
              background: #e50914;
              color: #fff;
              border: none;
              padding: 0.75rem 2rem;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              display: block;
              width: 100%;
              margin-bottom: 1rem;
              transition: background 0.2s;
            }
            .error-boundary-btn:hover { background: #f6121d; }
            .error-boundary-home {
              color: #888;
              text-decoration: none;
              font-size: 0.875rem;
            }
            .error-boundary-home:hover { color: #fff; }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
