import React from 'react';
import { Theme } from '../types';

interface TimerDisplayProps {
  timeMs: number;
  theme: Theme;
  isFullScreen: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeMs, theme, isFullScreen }) => {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10); // Show first 2 digits of ms

    const pad = (n: number) => n.toString().padStart(2, '0');

    return {
      min: pad(minutes),
      sec: pad(seconds),
      ms: pad(milliseconds),
    };
  };

  const { min, sec, ms } = formatTime(timeMs);

  return (
    <div 
      className={`font-mono font-bold tabular-nums tracking-tighter transition-all duration-300 select-none
        ${isFullScreen ? 'text-[20vw] leading-none' : 'text-[15vw] md:text-[12rem] leading-none'}
      `}
      style={{ color: theme.colors.text }}
    >
      <span className="inline-block">{min}</span>
      <span className="opacity-50 mx-2">:</span>
      <span className="inline-block">{sec}</span>
      <span className="text-[0.5em] align-top opacity-70 ml-2 inline-block" style={{ color: theme.colors.accent }}>
        .{ms}
      </span>
    </div>
  );
};

export default TimerDisplay;