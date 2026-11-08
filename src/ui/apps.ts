import type { TvApp } from '../tv';

/** Streaming shortcuts. Neutral color dots, no brand logos. */
export const TV_APPS: { id: TvApp; label: string; color: string }[] = [
  { id: 'youtube', label: 'YouTube', color: '#FF4B4B' },
  { id: 'netflix', label: 'Netflix', color: '#E50914' },
  { id: 'xupertv', label: 'XuperTV', color: '#7C9CFF' },
  { id: 'prime', label: 'Prime Video', color: '#2FB6FF' },
  { id: 'disney', label: 'Disney+', color: '#3E5BFF' },
  { id: 'hbo', label: 'HBO Max', color: '#9B5CFF' },
];
