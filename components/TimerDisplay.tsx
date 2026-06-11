import React from 'react';
import { Theme, TimerMode } from '../types';

interface TimerDisplayProps {
  timeMs: number;
  theme: Theme;
  isFullScreen: boolean;
  mode: TimerMode;
  countdownDuration: number;
  isActive: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  timeMs, 
  theme, 
  isFullScreen, 
  mode, 
  countdownDuration, 
  isActive 
}) => {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10); // Show first 2 digits of ms

    const pad = (n: number) => n.toString().padStart(2, '0');

    return {
      hr: hours > 0 ? pad(hours) : '',
      min: pad(minutes),
      sec: pad(seconds),
      ms: pad(milliseconds),
    };
  };

  const { hr, min, sec, ms } = formatTime(timeMs);

  // High-intensity urgency visual logic (final 10 seconds)
  const isEmergency = mode === TimerMode.COUNTDOWN && timeMs <= 10000 && timeMs > 0;
  
  // Calculate flash timing based on acceleration matching the beep intervals
  let flashSpeedMs = 1000;
  if (timeMs <= 1000) flashSpeedMs = 100;
  else if (timeMs <= 3000) flashSpeedMs = 250;
  else if (timeMs <= 5000) flashSpeedMs = 500;

  const isFlashing = isEmergency && isActive && (Math.floor(Date.now() / flashSpeedMs) % 2 === 0);

  // Compute progress bar width
  let progressPercent = 0;
  if (mode === TimerMode.COUNTDOWN) {
    progressPercent = countdownDuration > 0 ? (timeMs / countdownDuration) * 100 : 0;
  } else {
    // Stopwatch wraps progress bar every 60 seconds for a satisfying mechanical look
    progressPercent = ((timeMs % 60000) / 60000) * 100;
  }

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`font-mono font-bold tabular-nums tracking-tighter select-none transition-all duration-150 relative flex items-baseline
          ${isFullScreen ? 'text-[18vw] leading-none' : 'text-[13vw] sm:text-[14vw] md:text-[8.5rem] leading-none'}
          ${isFlashing ? 'scale-105 brightness-125' : 'scale-100'}
        `}
        style={{ 
          color: isEmergency ? theme.colors.accent : theme.colors.text,
          textShadow: isFlashing ? `0 0 40px ${theme.colors.accent}80` : 'none',
        }}
      >
        {hr && (
          <>
            <span className="inline-block">{hr}</span>
            <span className="opacity-40 px-1 select-none">:</span>
          </>
        )}
        <span className="inline-block">{min}</span>
        <span className="opacity-40 px-1 select-none">:</span>
        <span className="inline-block">{sec}</span>
        
        {/* Milliseconds block */}
        <span 
          className={`align-baseline ml-3 font-medium select-none
            ${isFullScreen ? 'text-[0.45em]' : 'text-[0.45em]'}
          `} 
          style={{ color: theme.colors.accent }}
        >
          .{ms}
        </span>
      </div>

      {/* Modern Sleek Glowing Progress Bar */}
      <div className={`h-1.5 w-72 md:w-96 rounded-full bg-white/10 overflow-hidden relative mt-6 transition-opacity duration-300 ${isFullScreen ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
        <div 
          className="absolute h-full left-0 top-0 rounded-full transition-all duration-75 ease-out"
          style={{ 
            width: `${progressPercent}%`,
            backgroundColor: theme.colors.accent,
            boxShadow: `0 0 12px ${theme.colors.accent}`,
          }}
        />
      </div>
    </div>
  );
};

export default TimerDisplay;