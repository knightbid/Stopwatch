import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimerMode, Theme } from './types';
import { THEMES, DEFAULT_COUNTDOWN_TIME } from './constants';
import TimerDisplay from './components/TimerDisplay';
import Controls from './components/Controls';
import ThemeSelector from './components/ThemeSelector';
import { audioService } from './services/audioService';
import { X, AlarmClock } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [customTheme, setCustomTheme] = useState<Theme>({
    id: 'custom',
    name: 'Custom',
    colors: { bg: '#202020', text: '#ffffff', accent: '#fbbf24' }
  });

  const [mode, setMode] = useState<TimerMode>(TimerMode.STOPWATCH);
  const [timeMs, setTimeMs] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  
  // Countdown config
  const [countdownDuration, setCountdownDuration] = useState<number>(DEFAULT_COUNTDOWN_TIME);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [inputMinutes, setInputMinutes] = useState<string>("1");
  const [inputSeconds, setInputSeconds] = useState<string>("0");

  // Refs for accurate timing
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const initialTimeRef = useRef<number>(0); // For handling pause/resume offset
  const lastBeepRef = useRef<number>(0);

  // --- Theme Application ---
  useEffect(() => {
    document.body.style.backgroundColor = theme.colors.bg;
    // We don't set text color globally to allow specific overrides, 
    // but the root div will inherit usually.
  }, [theme]);

  // --- Timer Logic ---
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  }, []);

  const handleTimerComplete = useCallback(() => {
    stopTimer();
    setTimeMs(0);
    audioService.playExplosion();
  }, [stopTimer]);

  const handleCountdownAudio = useCallback((remaining: number) => {
    const now = Date.now();
    let interval = 1000; // Default 1 beep per second
    let freq = 800;

    // "Bomb" logic: acceleration
    if (remaining > 10000) {
       return; // Silent if > 10s
    } else if (remaining <= 10000 && remaining > 5000) {
        interval = 1000;
        freq = 800;
    } else if (remaining <= 5000 && remaining > 3000) {
        interval = 500;
        freq = 1000;
    } else if (remaining <= 3000 && remaining > 1000) {
        interval = 250;
        freq = 1200;
    } else if (remaining <= 1000) {
        interval = 100;
        freq = 1500;
    }

    if (now - lastBeepRef.current >= interval) {
        audioService.playBeep(freq, 'square', 0.05);
        lastBeepRef.current = now;
    }
  }, []);

  const toggleTimer = useCallback(() => {
    if (isActive) {
      stopTimer();
      // Calculate remaining offset if we pause
    } else {
      setIsActive(true);
      startTimeRef.current = Date.now();
      
      // Initialize audio on user interaction
      audioService.playBeep(0, 'sine', 0.001); // Silent warmup

      if (mode === TimerMode.STOPWATCH) {
        initialTimeRef.current = timeMs;
        intervalRef.current = window.setInterval(() => {
          const now = Date.now();
          const elapsed = now - startTimeRef.current;
          setTimeMs(initialTimeRef.current + elapsed);
        }, 10);
      } else {
        // Countdown
        // If time is 0 and we hit play, reset to default duration
        let currentRemaining = timeMs;
        if (currentRemaining <= 0) {
            currentRemaining = countdownDuration;
            setTimeMs(countdownDuration);
        }
        
        initialTimeRef.current = currentRemaining;
        
        intervalRef.current = window.setInterval(() => {
          const now = Date.now();
          const elapsed = now - startTimeRef.current;
          const remaining = initialTimeRef.current - elapsed;

          if (remaining <= 0) {
            handleTimerComplete();
          } else {
            setTimeMs(remaining);
            handleCountdownAudio(remaining);
          }
        }, 10);
      }
    }
  }, [isActive, mode, timeMs, countdownDuration, handleTimerComplete, handleCountdownAudio, stopTimer]);

  const resetTimer = useCallback(() => {
    stopTimer();
    if (mode === TimerMode.STOPWATCH) {
      setTimeMs(0);
    } else {
      setTimeMs(countdownDuration);
    }
  }, [stopTimer, mode, countdownDuration]);

  const changeMode = (newMode: TimerMode) => {
    stopTimer();
    setMode(newMode);
    if (newMode === TimerMode.STOPWATCH) {
      setTimeMs(0);
    } else {
      setTimeMs(countdownDuration);
    }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only active in Full Screen
      if (!isFullScreen) return;

      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        toggleTimer();
      } else if (e.code === 'KeyR') {
        resetTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, toggleTimer, resetTimer]);

  // --- Full Screen Logic ---
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // Listen for escape key or native fullscreen exit
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // --- Settings Logic ---
  const saveSettings = () => {
    const mins = parseInt(inputMinutes) || 0;
    const secs = parseInt(inputSeconds) || 0;
    const totalMs = (mins * 60 + secs) * 1000;
    if (totalMs > 0) {
        setCountdownDuration(totalMs);
        if (mode === TimerMode.COUNTDOWN) {
            setTimeMs(totalMs);
            stopTimer();
        }
    }
    setShowSettings(false);
  }

  // --- Custom Theme Handler ---
  const handleCustomThemeChange = (newCustomTheme: Theme) => {
    setCustomTheme(newCustomTheme);
    if (theme.id === 'custom') {
      setTheme(newCustomTheme);
    }
  };

  // --- Render ---
  return (
    <div 
      className="min-h-screen flex flex-col items-center relative transition-colors duration-500 overflow-hidden"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.text }}
    >
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
         <div className="absolute top-0 left-0 w-full h-full" 
              style={{ backgroundImage: `radial-gradient(${theme.colors.accent} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
         </div>
      </div>

      {/* Main Content Area */}
      <main className={`flex-grow flex flex-col items-center justify-center w-full z-10 ${isFullScreen ? 'cursor-none' : ''}`}>
        
        {/* Timer */}
        <div 
            onClick={isFullScreen ? toggleFullScreen : undefined}
            className={`${isFullScreen ? 'cursor-pointer' : ''}`}
        >
             <TimerDisplay timeMs={timeMs} theme={theme} isFullScreen={isFullScreen} />
        </div>

        {/* Controls - Hidden in Full Screen */}
        {!isFullScreen && (
          <div className="mt-12 flex flex-col items-center gap-8 w-full px-4 animate-fade-in-up">
            <Controls
              isActive={isActive}
              mode={mode}
              theme={theme}
              onToggleActive={toggleTimer}
              onReset={resetTimer}
              onModeChange={changeMode}
              onFullScreen={toggleFullScreen}
              onSettings={() => setShowSettings(true)}
            />
            
            <div className="mt-8 border-t border-opacity-20 pt-8 w-full max-w-lg" style={{ borderColor: theme.colors.text }}>
                <p className="text-center mb-4 text-xs uppercase tracking-widest opacity-60">Select Theme</p>
                <ThemeSelector 
                  currentTheme={theme} 
                  onSelect={setTheme} 
                  customTheme={customTheme}
                  onCustomThemeChange={handleCustomThemeChange}
                />
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div 
                className="p-8 rounded-2xl shadow-2xl w-full max-w-sm border relative"
                style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.accent }}
            >
                <button 
                    onClick={() => setShowSettings(false)}
                    className="absolute top-4 right-4 opacity-70 hover:opacity-100"
                    style={{ color: theme.colors.text }}
                >
                    <X size={24} />
                </button>
                
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <AlarmClock size={24} style={{ color: theme.colors.accent }} />
                    Countdown Setup
                </h2>
                
                <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <label className="block text-xs uppercase tracking-wider mb-2 opacity-70">Minutes</label>
                        <input 
                            type="number" 
                            value={inputMinutes}
                            onChange={(e) => setInputMinutes(e.target.value)}
                            className="w-full bg-transparent border-b-2 text-2xl font-mono focus:outline-none p-2"
                            style={{ borderColor: theme.colors.accent, color: theme.colors.text }}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs uppercase tracking-wider mb-2 opacity-70">Seconds</label>
                        <input 
                            type="number" 
                            value={inputSeconds}
                            onChange={(e) => setInputSeconds(e.target.value)}
                            className="w-full bg-transparent border-b-2 text-2xl font-mono focus:outline-none p-2"
                            style={{ borderColor: theme.colors.accent, color: theme.colors.text }}
                        />
                    </div>
                </div>

                <button
                    onClick={saveSettings}
                    className="w-full py-3 rounded-xl font-bold uppercase tracking-wider transition-transform active:scale-95"
                    style={{ backgroundColor: theme.colors.accent, color: theme.colors.bg }}
                >
                    Save & Set
                </button>
            </div>
        </div>
      )}

      {/* Hint for Full Screen exit */}
      {isFullScreen && (
          <div className="fixed bottom-10 text-white/20 text-sm pointer-events-none">
              Space: Pause/Start &bull; R: Reset &bull; ESC: Exit
          </div>
      )}
    </div>
  );
};

export default App;