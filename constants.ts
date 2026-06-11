import { Theme } from './types';

export const THEMES: Theme[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      bg: '#09090b',
      text: '#e4e4e7',
      accent: '#f43f5e', // Rose
    },
  },
  {
    id: 'matrix',
    name: 'Matrix',
    colors: {
      bg: '#000000',
      text: '#22c55e',
      accent: '#4ade80', // Green
    },
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    colors: {
      bg: '#0f172a',
      text: '#e2e8f0',
      accent: '#38bdf8', // Sky
    },
  },
  {
    id: 'classic-light',
    name: 'Classic Light',
    colors: {
      bg: '#ffffff',
      text: '#1e293b',
      accent: '#2563eb', // Blue
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      bg: '#2a0a18',
      text: '#fcd34d',
      accent: '#fb923c', // Orange
    },
  },
];

export const DEFAULT_COUNTDOWN_TIME = 30 * 1000; // 30 seconds in ms