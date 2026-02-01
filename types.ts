export enum TimerMode {
  STOPWATCH = 'STOPWATCH',
  COUNTDOWN = 'COUNTDOWN',
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
  };
}

export interface AudioConfig {
  enabled: boolean;
}