import React from 'react';
import { Theme, TimerMode } from '../types';
import { Play, Pause, RotateCcw, Maximize, Settings, AlarmClock, Flag } from 'lucide-react';

interface ControlsProps {
  isActive: boolean;
  mode: TimerMode;
  theme: Theme;
  onToggleActive: () => void;
  onReset: () => void;
  onModeChange: (mode: TimerMode) => void;
  onFullScreen: () => void;
  onSettings: () => void;
  onLap?: () => void;
  onAdjustDuration?: (ms: number) => void;
}

const Controls: React.FC<ControlsProps> = ({
  isActive,
  mode,
  theme,
  onToggleActive,
  onReset,
  onModeChange,
  onFullScreen,
  onSettings,
  onLap,
  onAdjustDuration,
}) => {
  const buttonBaseClass = "p-4 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center";

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      
      {/* Primary Transport Controls */}
      <div className="flex justify-center items-center gap-6">
        {mode === TimerMode.STOPWATCH && isActive ? (
          <button
            onClick={onLap}
            className={`${buttonBaseClass} opacity-90 hover:opacity-100 animate-pulse`}
            style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent, border: `1px solid ${theme.colors.accent}40` }}
            title="Record Lap"
          >
            <Flag size={24} className="animate-bounce" />
          </button>
        ) : (
          <button
            onClick={onReset}
            className={`${buttonBaseClass} opacity-80 hover:opacity-100`}
            style={{ backgroundColor: `${theme.colors.text}20`, color: theme.colors.text }}
            title="Reset"
          >
            <RotateCcw size={24} />
          </button>
        )}

        <button
          onClick={onToggleActive}
          className={`${buttonBaseClass} w-24 h-24`}
          style={{ 
            backgroundColor: isActive ? theme.colors.bg : theme.colors.accent,
            color: isActive ? theme.colors.accent : theme.colors.bg,
            border: `4px solid ${theme.colors.accent}`,
            boxShadow: isActive ? 'none' : `0 0 25px ${theme.colors.accent}60`,
          }}
          title={isActive ? "Pause" : "Start"}
        >
          {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
        </button>

        <button
          onClick={onFullScreen}
          className={`${buttonBaseClass} opacity-80 hover:opacity-100`}
          style={{ backgroundColor: `${theme.colors.text}20`, color: theme.colors.text }}
          title="Full Screen"
        >
          <Maximize size={24} />
        </button>
      </div>

      {/* Quick Presets for Countdown Mode */}
      {mode === TimerMode.COUNTDOWN && onAdjustDuration && (
        <div className="flex justify-center flex-wrap gap-2 animate-fade-in-up mt-1">
          {[-60000, -10000, 10000, 60000, 300000].map((offsetMs) => {
            const sign = offsetMs > 0 ? '+' : '';
            const magnitude = Math.abs(offsetMs);
            const label = magnitude >= 60000 
              ? `${magnitude / 60000}m` 
              : `${magnitude / 1000}s`;
            const displayLabel = `${sign}${offsetMs < 0 ? '-' : ''}${label}`;

            return (
              <button
                key={offsetMs}
                onClick={() => onAdjustDuration(offsetMs)}
                className="px-3 py-1 text-xs font-mono font-semibold rounded-full border transition-all duration-150 hover:scale-105 active:scale-95"
                style={{ 
                  borderColor: `${theme.colors.text}30`, 
                  color: theme.colors.text,
                  backgroundColor: `${theme.colors.text}08`
                }}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Secondary Mode & Settings */}
      <div className="flex justify-center gap-4 mt-2">
        <div className="flex rounded-lg overflow-hidden border border-opacity-20" style={{ borderColor: theme.colors.text }}>
            <button 
                onClick={() => onModeChange(TimerMode.STOPWATCH)}
                className={`px-4 py-2 text-sm font-bold transition-colors ${mode === TimerMode.STOPWATCH ? 'opacity-100' : 'opacity-50'}`}
                style={{ 
                    backgroundColor: mode === TimerMode.STOPWATCH ? theme.colors.accent : 'transparent',
                    color: mode === TimerMode.STOPWATCH ? theme.colors.bg : theme.colors.text
                }}
            >
                Stopwatch
            </button>
            <button 
                onClick={() => onModeChange(TimerMode.COUNTDOWN)}
                className={`px-4 py-2 text-sm font-bold transition-colors ${mode === TimerMode.COUNTDOWN ? 'opacity-100' : 'opacity-50'}`}
                style={{ 
                    backgroundColor: mode === TimerMode.COUNTDOWN ? theme.colors.accent : 'transparent',
                    color: mode === TimerMode.COUNTDOWN ? theme.colors.bg : theme.colors.text
                }}
            >
                Countdown
            </button>
        </div>

        {mode === TimerMode.COUNTDOWN && (
             <button
             onClick={onSettings}
             className="p-2 rounded-lg opacity-80 hover:opacity-100 transition-opacity"
             style={{ color: theme.colors.text, backgroundColor: `${theme.colors.text}10` }}
             title="Timer Settings"
           >
             <Settings size={20} />
           </button>
        )}
      </div>
    </div>
  );
};

export default Controls;