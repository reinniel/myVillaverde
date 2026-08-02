import React from 'react';
import type { Barangay } from '../types/app';

export const BarangayArtwork: React.FC<{ barangay: Barangay; compact?: boolean }> = ({
  barangay,
  compact = false,
}) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 400 180"
    preserveAspectRatio="none"
    className="pointer-events-none absolute inset-0 h-full w-full"
  >
    <circle
      cx={barangay.orb[0]}
      cy={barangay.orb[1]}
      r={barangay.orb[2]}
      fill="rgba(255,255,255,0.10)"
    />
    <path
      d={barangay.artworkPath}
      fill="none"
      stroke="rgba(255,255,255,0.17)"
      strokeWidth={compact ? 24 : 30}
      strokeLinecap="round"
    />
    <path
      d={barangay.artworkPath}
      fill="none"
      stroke="rgba(255,255,255,0.08)"
      strokeWidth={compact ? 5 : 7}
      strokeLinecap="round"
      transform="translate(0 26)"
    />
  </svg>
);
