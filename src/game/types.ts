export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GARAGE';

export type WeatherType = 'clear' | 'light_snow' | 'blizzard';

export interface Upgrades {
  bladeWidth: number;   // 1 to 5 (widens the plow blade and clearing radius)
  enginePower: number;  // 1 to 5 (top speed and acceleration)
  snowCapacity: number; // 1 to 5 (coin earnings per snow volume & combo multiplier bonus)
  saltTurbo: number;    // 1 to 5 (boost max speed & duration, melt radius)
  gripTires: number;    // 1 to 5 (traction, drift responsiveness, ice handling)
}

export type TruckColor = 'orange' | 'yellow' | 'teal' | 'red' | 'navy';

export interface District {
  id: number;
  name: string;
  theme: string;
  description: string;
  targetPercent: number; // e.g. 85% to pass
  gridWidth: number;
  gridDepth: number;
  weather: WeatherType;
  timeOfDay: 'day' | 'sunset' | 'twilight';
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  opacity: number;
}

export interface GameTelemetry {
  snowCleared: number;
  totalSnow: number;
  percentCleared: number;
  coins: number;
  score: number;
  combo: number;
  comboTimer: number; // 0 to 1
  maxCombo: number;
  boostEnergy: number; // 0 to 100
  isBoosting: boolean;
  speed: number;
  isPlowing: boolean;
  fps: number;
  weather: WeatherType;
  weatherTimer: number; // 0 to 1 progress toward next weather
  windSpeed: number; // in km/h
  traction: number; // 0 to 100%
  itemsFound: number;
  blizzardSnowPlowed: number;
}
