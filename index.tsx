import { TimerMode, Theme } from './types';
import { THEMES, DEFAULT_COUNTDOWN_TIME } from './constants';
import { audioService } from './services/audioService';

// --- Application Core State ---
let currentTheme: Theme = THEMES[0];
let customTheme: Theme = {
  id: 'custom',
  name: 'Custom',
  colors: { bg: '#202020', text: '#ffffff', accent: '#fbbf24' }
};

let mode: TimerMode = TimerMode.STOPWATCH;
let timeMs: number = 0;
let isActive: boolean = false;
let isFullScreen: boolean = false;
let countdownDuration: number = DEFAULT_COUNTDOWN_TIME;
let laps: number[] = [];
let lastBeep: number = 0;

// Refs for physical accurate timing
let intervalId: number | null = null;
let startTime: number = 0;
let initialTime: number = 0;

// --- DOM Initial Handler & Event Wiring ---
window.addEventListener('DOMContentLoaded', () => {
  // Bind standard layout elements
  bindEvents();
  
  // Apply the bootup theme
  applyTheme(currentTheme);

  // Set initial mode configuration
  changeMode(TimerMode.STOPWATCH);
});

function bindEvents() {
  // Play button click
  const btnPlayPause = document.getElementById('btn-play-pause');
  btnPlayPause?.addEventListener('click', toggleTimer);

  // Click on timer itself triggers fullscreen toggle
  const timerInteractiveZone = document.getElementById('timer-interactive-zone');
  timerInteractiveZone?.addEventListener('click', () => {
    if (isFullScreen) {
      toggleFullScreen();
    }
  });

  // Reset button click
  const btnReset = document.getElementById('btn-reset');
  btnReset?.addEventListener('click', resetTimer);

  // Lap split button click
  const btnLap = document.getElementById('btn-lap');
  btnLap?.addEventListener('click', recordLap);

  // Fullscreen toggle click
  const btnFullscreen = document.getElementById('btn-fullscreen');
  btnFullscreen?.addEventListener('click', toggleFullScreen);

  // Selector mode toggling
  const modeStopwatchBtn = document.getElementById('mode-stopwatch');
  const modeCountdownBtn = document.getElementById('mode-countdown');
  
  modeStopwatchBtn?.addEventListener('click', () => changeMode(TimerMode.STOPWATCH));
  modeCountdownBtn?.addEventListener('click', () => changeMode(TimerMode.COUNTDOWN));

  // Quick preset adding offsets
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const offset = parseInt(target.getAttribute('data-offset') || '0', 10);
      adjustDuration(offset);
    });
  });

  // Settings modals
  const btnSettingsOpen = document.getElementById('btn-settings-open');
  const btnSettingsClose = document.getElementById('btn-settings-close');
  const btnSettingsSave = document.getElementById('btn-settings-save');

  btnSettingsOpen?.addEventListener('click', openSettings);
  btnSettingsClose?.addEventListener('click', closeSettings);
  btnSettingsSave?.addEventListener('click', saveSettings);

  // Real-time custom picking color inputs
  const pickerBg = document.getElementById('picker-bg') as HTMLInputElement;
  const pickerText = document.getElementById('picker-text') as HTMLInputElement;
  const pickerAccent = document.getElementById('picker-accent') as HTMLInputElement;

  const updateCustomColors = () => {
    customTheme.colors = {
      bg: pickerBg.value,
      text: pickerText.value,
      accent: pickerAccent.value,
    };
    if (currentTheme.id === 'custom') {
      applyTheme(customTheme);
    }
  };

  pickerBg?.addEventListener('input', updateCustomColors);
  pickerText?.addEventListener('input', updateCustomColors);
  pickerAccent?.addEventListener('input', updateCustomColors);

  // Global key bindings
  window.addEventListener('keydown', handleKeyboard);

  // Native resize/fullscreen listeners
  document.addEventListener('fullscreenchange', () => {
    setFullScreenState(!!document.fullscreenElement);
  });
}

// --- Display Formatter View Updater ---
function updateTimerDisplay() {
  const totalSeconds = Math.floor(timeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((timeMs % 1000) / 10);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const hrSegment = document.getElementById('hr-segment');
  const hrVal = document.getElementById('hr-val');
  if (hours > 0) {
    if (hrVal) hrVal.textContent = pad(hours);
    hrSegment?.classList.remove('hidden');
  } else {
    hrSegment?.classList.add('hidden');
  }

  const minVal = document.getElementById('min-val');
  if (minVal) minVal.textContent = pad(minutes);

  const secVal = document.getElementById('sec-val');
  if (secVal) secVal.textContent = pad(seconds);

  const msVal = document.getElementById('ms-val');
  if (msVal) msVal.textContent = `.${pad(milliseconds)}`;

  // Emergency Flash Alerts (final 10 seconds of Countdown)
  const timerDisplayBox = document.getElementById('timer-display-box');
  const isEmergency = mode === TimerMode.COUNTDOWN && timeMs <= 10000 && timeMs > 0;

  if (isEmergency) {
    timerDisplayBox?.style.setProperty('color', currentTheme.colors.accent);
    let flashSpeedMs = 1000;
    if (timeMs <= 1000) flashSpeedMs = 100;
    else if (timeMs <= 3000) flashSpeedMs = 250;
    else if (timeMs <= 5000) flashSpeedMs = 500;

    const isFlashing = isActive && (Math.floor(Date.now() / flashSpeedMs) % 2 === 0);
    if (isFlashing) {
      timerDisplayBox?.classList.add('scale-105', 'brightness-125');
      timerDisplayBox?.style.setProperty('text-shadow', `0 0 40px ${currentTheme.colors.accent}aa`);
    } else {
      timerDisplayBox?.classList.remove('scale-105', 'brightness-125');
      timerDisplayBox?.style.removeProperty('text-shadow');
    }
  } else {
    timerDisplayBox?.style.setProperty('color', currentTheme.colors.text);
    timerDisplayBox?.classList.remove('scale-105', 'brightness-125');
    timerDisplayBox?.style.removeProperty('text-shadow');
  }

  // Update mechanical progress bar width on HUD
  let progressPercent = 0;
  if (mode === TimerMode.COUNTDOWN) {
    progressPercent = countdownDuration > 0 ? (timeMs / countdownDuration) * 100 : 0;
  } else {
    progressPercent = ((timeMs % 60000) / 60000) * 100;
  }
  
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progressPercent}%`;
  }
}

// --- Active Intervals & Timer Controller Actions ---
function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isActive = false;
  updatePlayPauseUI();
}

function handleTimerComplete() {
  stopTimer();
  timeMs = 0;
  updateTimerDisplay();
  audioService.playExplosion();
}

function handleCountdownAudio(remaining: number) {
  const now = Date.now();
  let interval = 1000;
  let freq = 800;

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

  if (now - lastBeep >= interval) {
    audioService.playBeep(freq, 'square', 0.05);
    lastBeep = now;
  }
}

function toggleTimer() {
  if (isActive) {
    stopTimer();
  } else {
    isActive = true;
    startTime = Date.now();

    // Sound warmer
    audioService.playBeep(0, 'sine', 0.001);

    if (mode === TimerMode.STOPWATCH) {
      initialTime = timeMs;
      intervalId = window.setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        timeMs = initialTime + elapsed;
        updateTimerDisplay();
      }, 10);
    } else {
      let currentRemaining = timeMs;
      if (currentRemaining <= 0) {
        currentRemaining = countdownDuration;
        timeMs = countdownDuration;
      }
      initialTime = currentRemaining;

      intervalId = window.setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = initialTime - elapsed;

        if (remaining <= 0) {
          handleTimerComplete();
        } else {
          timeMs = remaining;
          updateTimerDisplay();
          handleCountdownAudio(remaining);
        }
      }, 10);
    }
    updatePlayPauseUI();
  }
}

function resetTimer() {
  stopTimer();
  laps = [];
  renderLapsTable();
  if (mode === TimerMode.STOPWATCH) {
    timeMs = 0;
  } else {
    timeMs = countdownDuration;
  }
  updateTimerDisplay();
}

function recordLap() {
  if (isActive && mode === TimerMode.STOPWATCH) {
    laps.push(timeMs);
    audioService.playBeep(920, 'sine', 0.08); // high chime splits sound
    renderLapsTable();
  }
}

function adjustDuration(offsetMs: number) {
  if (mode === TimerMode.COUNTDOWN) {
    const nextTime = Math.max(1000, timeMs + offsetMs);
    timeMs = nextTime;

    if (isActive) {
      initialTime = nextTime;
      startTime = Date.now();
    } else {
      countdownDuration = Math.max(1000, countdownDuration + offsetMs);
    }

    audioService.playBeep(640, 'sine', 0.05);
    updateTimerDisplay();
  }
}

// --- Overlay Dialog & Controls State HUD ---
function updatePlayPauseUI() {
  const svgPlay = document.getElementById('svg-play');
  const svgPause = document.getElementById('svg-pause');
  const btnPlayPause = document.getElementById('btn-play-pause');

  if (isActive) {
    svgPlay?.classList.add('hidden');
    svgPause?.classList.remove('hidden');

    if (btnPlayPause) {
      btnPlayPause.style.backgroundColor = currentTheme.colors.bg;
      btnPlayPause.style.color = currentTheme.colors.accent;
      btnPlayPause.style.boxShadow = 'none';
    }
  } else {
    svgPlay?.classList.remove('hidden');
    svgPause?.classList.add('hidden');

    if (btnPlayPause) {
      btnPlayPause.style.backgroundColor = currentTheme.colors.accent;
      btnPlayPause.style.color = currentTheme.colors.bg;
      btnPlayPause.style.boxShadow = `0 0 25px ${currentTheme.colors.accent}60`;
    }
  }

  // Toggle contextual buttons (Lap vs Reset)
  const btnReset = document.getElementById('btn-reset');
  const btnLap = document.getElementById('btn-lap');

  if (mode === TimerMode.STOPWATCH && isActive) {
    btnReset?.classList.add('hidden');
    btnLap?.classList.remove('hidden');
    btnLap?.classList.add('flex');
    if (btnLap) {
      btnLap.style.backgroundColor = `${currentTheme.colors.accent}1a`;
      btnLap.style.borderColor = `${currentTheme.colors.accent}40`;
      btnLap.style.color = currentTheme.colors.accent;
    }
  } else {
    btnReset?.classList.remove('hidden');
    btnLap?.classList.add('hidden');
    btnLap?.classList.remove('flex');
  }
}

function changeMode(newMode: TimerMode) {
  stopTimer();
  mode = newMode;
  laps = [];
  renderLapsTable();

  const presetsPanel = document.getElementById('presets-panel');
  if (newMode === TimerMode.COUNTDOWN) {
    presetsPanel?.classList.remove('hidden');
    presetsPanel?.classList.add('flex');
    timeMs = countdownDuration;
  } else {
    presetsPanel?.classList.add('hidden');
    presetsPanel?.classList.remove('flex');
    timeMs = 0;
  }

  // Visual toggle updates of selector
  const modeStopwatch = document.getElementById('mode-stopwatch');
  const modeCountdown = document.getElementById('mode-countdown');

  if (newMode === TimerMode.STOPWATCH) {
    setTabActive(modeStopwatch, true);
    setTabActive(modeCountdown, false);
  } else {
    setTabActive(modeStopwatch, false);
    setTabActive(modeCountdown, true);
  }

  updateTimerDisplay();
  updatePlayPauseUI();
}

function setTabActive(el: HTMLElement | null, active: boolean) {
  if (!el) return;
  if (active) {
    el.classList.remove('hover:bg-white/5', 'text-white');
    el.classList.add('bg-[#f43f5e]', 'text-[#09090b]');
    el.style.backgroundColor = currentTheme.colors.accent;
    el.style.color = currentTheme.colors.bg;
  } else {
    el.classList.add('hover:bg-white/5', 'text-white');
    el.classList.remove('bg-[#f43f5e]', 'text-[#09090b]');
    el.style.removeProperty('background-color');
    el.style.removeProperty('color');
  }
}

function renderLapsTable() {
  const lapsBoard = document.getElementById('laps-board');
  const lapsList = document.getElementById('laps-list');
  if (!lapsBoard || !lapsList) return;

  if (laps.length === 0) {
    lapsBoard.classList.add('hidden');
    return;
  }

  lapsBoard.classList.remove('hidden');
  lapsList.innerHTML = '';

  const formatLap = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const c = Math.floor((ms % 1000) / 10);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(m)}:${pad(s)}.${pad(c)}`;
  };

  for (let i = laps.length - 1; i >= 0; i--) {
    const lapTime = laps[i];
    const lapDiv = document.createElement('div');
    lapDiv.className = 'flex justify-between items-center text-sm px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all tabular-nums';
    lapDiv.innerHTML = `
      <span class="font-semibold opacity-70">Lap ${i + 1}</span>
      <span class="opacity-95" style="color: ${currentTheme.colors.text}">${formatLap(lapTime)}</span>
    `;
    lapsList.appendChild(lapDiv);
  }
}

// --- Setup Modal Handles ---
function openSettings() {
  const totalSeconds = Math.floor(countdownDuration / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  const inputMinutes = document.getElementById('input-minutes') as HTMLInputElement;
  const inputSeconds = document.getElementById('input-seconds') as HTMLInputElement;

  if (inputMinutes) inputMinutes.value = m.toString();
  if (inputSeconds) inputSeconds.value = s.toString();

  const modal = document.getElementById('modal-settings');
  modal?.classList.remove('hidden');
}

function closeSettings() {
  const modal = document.getElementById('modal-settings');
  modal?.classList.add('hidden');
}

function saveSettings() {
  const inputMinutes = document.getElementById('input-minutes') as HTMLInputElement;
  const inputSeconds = document.getElementById('input-seconds') as HTMLInputElement;

  const mins = parseInt(inputMinutes?.value || '0', 10) || 0;
  const secs = parseInt(inputSeconds?.value || '0', 10) || 0;
  const totalMs = (mins * 60 + secs) * 1000;

  if (totalMs > 0) {
    countdownDuration = totalMs;
    if (mode === TimerMode.COUNTDOWN) {
      timeMs = totalMs;
      stopTimer();
      updateTimerDisplay();
    }
  }
  closeSettings();
}

// --- Custom Interactive Theme Application Engine ---
function applyTheme(themeObj: Theme) {
  currentTheme = themeObj;

  // Background and base body layout updates
  document.body.style.backgroundColor = themeObj.colors.bg;
  document.body.style.color = themeObj.colors.text;

  const appEl = document.getElementById('app');
  if (appEl) {
    appEl.style.backgroundColor = themeObj.colors.bg;
    appEl.style.color = themeObj.colors.text;
  }

  // Accent gradient decor highlights
  const bgDecor = document.getElementById('bg-decor');
  if (bgDecor) {
    bgDecor.style.backgroundImage = `radial-gradient(${themeObj.colors.accent}1f 1px, transparent 1px)`;
  }

  // Update mechanical progress bar style sheets
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.style.backgroundColor = themeObj.colors.accent;
    progressBar.style.boxShadow = `0 0 12px ${themeObj.colors.accent}`;
  }

  // Text values accent colors
  const msVal = document.getElementById('ms-val');
  if (msVal) {
    msVal.style.color = themeObj.colors.accent;
  }

  // Save Settings Modal design themes
  const modalCard = document.getElementById('modal-card');
  const btnSettingsSave = document.getElementById('btn-settings-save');
  const inputMinutes = document.getElementById('input-minutes');
  const inputSeconds = document.getElementById('input-seconds');

  if (modalCard) {
    modalCard.style.backgroundColor = themeObj.colors.bg;
    modalCard.style.borderColor = themeObj.colors.accent;
    modalCard.style.color = themeObj.colors.text;
  }
  if (btnSettingsSave) {
    btnSettingsSave.style.backgroundColor = themeObj.colors.accent;
    btnSettingsSave.style.color = themeObj.colors.bg;
    btnSettingsSave.style.boxShadow = `0 0 15px ${themeObj.colors.accent}40`;
  }
  if (inputMinutes) {
    (inputMinutes as HTMLElement).style.borderColor = themeObj.colors.accent;
  }
  if (inputSeconds) {
    (inputSeconds as HTMLElement).style.borderColor = themeObj.colors.accent;
  }

  // Active select tab options styling
  const modeStopwatch = document.getElementById('mode-stopwatch');
  const modeCountdown = document.getElementById('mode-countdown');
  
  if (mode === TimerMode.STOPWATCH) {
    setTabActive(modeStopwatch, true);
    setTabActive(modeCountdown, false);
  } else {
    setTabActive(modeStopwatch, false);
    setTabActive(modeCountdown, true);
  }

  // Repaint split laps board colors
  const lapsBoard = document.getElementById('laps-board');
  if (lapsBoard) {
    lapsBoard.style.backgroundColor = `${themeObj.colors.text}05`;
    lapsBoard.style.borderColor = `${themeObj.colors.text}1c`;
  }

  // Trigger dynamic preset updates
  updatePlayPauseUI();
  renderThemeSelectors();
}

function renderThemeSelectors() {
  const grid = document.getElementById('themes-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const allThemes = [...THEMES, customTheme];
  allThemes.forEach(t => {
    const isSelected = t.id === currentTheme.id;
    const btn = document.createElement('button');
    
    btn.className = `flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 hover:bg-white/5 active:scale-95 ${
      isSelected ? 'opacity-100 font-bold shadow-inner' : 'opacity-65 border-white/5'
    }`;
    
    btn.style.borderColor = isSelected ? currentTheme.colors.accent : 'rgba(255, 255, 255, 0.1)';
    if (isSelected) {
      btn.style.boxShadow = `0 0 10px ${currentTheme.colors.accent}40`;
    }

    btn.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${t.colors.accent};"></span>
      <span>${t.name}</span>
    `;

    btn.addEventListener('click', () => {
      applyTheme(t);
      const builder = document.getElementById('custom-theme-builder');
      if (t.id === 'custom') {
        builder?.classList.remove('hidden');
        // sync input picking components initial color
        const pickerBg = document.getElementById('picker-bg') as HTMLInputElement;
        const pickerText = document.getElementById('picker-text') as HTMLInputElement;
        const pickerAccent = document.getElementById('picker-accent') as HTMLInputElement;
        if (pickerBg) pickerBg.value = customTheme.colors.bg;
        if (pickerText) pickerText.value = customTheme.colors.text;
        if (pickerAccent) pickerAccent.value = customTheme.colors.accent;
      } else {
        builder?.classList.add('hidden');
      }
    });

    grid.appendChild(btn);
  });
}

// --- Keyboard Shortcuts ---
function handleKeyboard(e: KeyboardEvent) {
  if (
    document.activeElement?.tagName === 'INPUT' || 
    document.activeElement?.tagName === 'TEXTAREA' ||
    document.activeElement?.hasAttribute('contenteditable')
  ) {
    return;
  }

  if (e.code === 'Space') {
    e.preventDefault();
    toggleTimer();
  } else if (e.code === 'KeyR') {
    resetTimer();
  } else if (e.code === 'KeyL' && mode === TimerMode.STOPWATCH) {
    recordLap();
  } else if (e.code === 'KeyF') {
    toggleFullScreen();
  }
}

// --- Full Screen Logic Manager ---
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      setFullScreenState(true);
    }).catch(err => {
      console.error(`Error attempting to enable full-screen mode: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setFullScreenState(false);
    }
  }
}

function setFullScreenState(state: boolean) {
  isFullScreen = state;
  const controlsHUD = document.getElementById('controls-hud');
  const helper = document.getElementById('fullscreen-helper');
  const mainC = document.getElementById('main-container');

  if (isFullScreen) {
    controlsHUD?.classList.add('hidden');
    helper?.classList.remove('hidden');
    mainC?.classList.add('cursor-none');
    mainC?.classList.add('cursor-pointer');
  } else {
    controlsHUD?.classList.remove('hidden');
    helper?.classList.add('hidden');
    mainC?.classList.remove('cursor-none');
    mainC?.classList.remove('cursor-pointer');
  }
}
