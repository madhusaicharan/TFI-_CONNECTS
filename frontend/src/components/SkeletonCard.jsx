import React from 'react';
import './SkeletonCard.css';

/**
 * SkeletonCard
 * Matches the dimensions of the standard movie card.
 * Shows a pulsing shimmer while data is loading.
 * 
 * @param {number} count — How many skeleton cards to render (default: 6)
 */
const SkeletonCard = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div className="skeleton-card" key={i} aria-hidden="true">
        <div className="skeleton-poster" />
        <div className="skeleton-body">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-subtitle" />
          <div className="skeleton-line skeleton-rating" />
        </div>
      </div>
    ))}
  </>
);

export default SkeletonCard;
