import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  /**
   * Show a toast notification.
   * @param {string} message   — Text to display
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {number} duration  — ms before auto-dismiss (0 = manual only)
   */
  const showToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        timers.current[id] = setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast]
  );

  // Convenience shortcuts
  const toast = {
    success: (msg, dur) => showToast(msg, 'success', dur),
    error:   (msg, dur) => showToast(msg, 'error',   dur ?? 6000),
    info:    (msg, dur) => showToast(msg, 'info',    dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

// ── Container + Toast UI ──────────────────────────────────────────────────────
const ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const COLORS = {
  success: '#22c55e',
  error:   '#ef4444',
  warning: '#f59e0b',
  info:    '#3b82f6',
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        .tfi-toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 99999;
          pointer-events: none;
        }
        .tfi-toast {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 300px;
          max-width: 400px;
          background: #1c1c1e;
          border: 1px solid rgba(255,255,255,0.1);
          border-left: 4px solid var(--toast-accent);
          border-radius: 10px;
          padding: 14px 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          pointer-events: all;
          animation: toastSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
          font-family: 'Inter', sans-serif;
        }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(120%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .tfi-toast-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
        .tfi-toast-body { flex: 1; }
        .tfi-toast-msg {
          font-size: 0.875rem;
          color: #f1f1f1;
          line-height: 1.4;
          font-weight: 500;
        }
        .tfi-toast-close {
          background: none;
          border: none;
          color: #888;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 0 0 0 4px;
          flex-shrink: 0;
          transition: color 0.2s;
          align-self: flex-start;
        }
        .tfi-toast-close:hover { color: #fff; }
        @media (max-width: 480px) {
          .tfi-toast-container { right: 12px; left: 12px; bottom: 16px; }
          .tfi-toast { min-width: unset; max-width: 100%; }
        }
      `}</style>
      <div className="tfi-toast-container" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="tfi-toast"
            style={{ '--toast-accent': COLORS[t.type] || COLORS.info }}
            role="alert"
          >
            <span className="tfi-toast-icon" aria-hidden="true">{ICONS[t.type]}</span>
            <div className="tfi-toast-body">
              <p className="tfi-toast-msg">{t.message}</p>
            </div>
            <button
              className="tfi-toast-close"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default ToastProvider;
