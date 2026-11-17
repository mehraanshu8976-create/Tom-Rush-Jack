export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type HeroId = 'jack_tom' | 'cyber_tom' | 'jet_angela' | 'hover_ben';

export type WorldId = 'metro_city' | 'sunset_beach' | 'arctic_canyon' | 'pharaoh_temple';

export interface HeroConfig {
  id: HeroId;
  name: string;
  codename: string;
  powerName: string;
  powerDesc: string;
  cost: number;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  auraColor: number;
  furColor: number;
  hasCape: boolean;
  hasHelmet: boolean;
  hasHoverBike: boolean;
  speedBonus: number;
  magnetBonus: number;
  coinMultiplier: number;
  previewImage: string;
}

export interface WorldConfig {
  id: WorldId;
  name: string;
  subtitle: string;
  cost: number;
  skyTop: number;
  skyBottom: number;
  fogColor: number;
  roadColor: number;
  stripeColor: number;
  curbColor: number;
  groundColor: number;
  accentColor: number;
  lightWarm: number;
  hemiSky: number;
  hemiGround: number;
  previewImage: string;
}

export interface GalleryPicture {
  id: string;
  title: string;
  tag: string;
  imageUrl: string;
  worldId: WorldId;
  heroId: HeroId;
}

export type LaneIndex = -1 | 0 | 1;

export type EntityKind =
  | 'coin'
  | 'shield'
  | 'magnet'
  | 'jetboost'
  | 'multiplier'
  | 'barrier_low'
  | 'beam_high'
  | 'truck'
  | 'dumpster'
  | 'ramp'
  | 'raccoon_patrol'
  | 'raccoon_jackhammer'
  | 'raccoon_boss';

export interface SimEntity {
  id: number;
  kind: EntityKind;
  lane: LaneIndex;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  collected: boolean;
  defeated: boolean;
  knockVelX: number;
  knockVelY: number;
  knockVelZ: number;
  knockTimer: number;
  phase: number;
}

export interface HudSnapshot {
  score: number;
  coins: number;
  raccoons: number;
  hearts: number;
  maxHearts: number;
  powerCharge: number; // 0 to 100
  powerActiveTimer: number;
  shieldTimer: number;
  magnetTimer: number;
  jetTimer: number;
  multiplierTimer: number;
  distance: number;
  speed: number;
  worldId: WorldId;
  heroId: HeroId;
  comboCount: number;
}

export interface RunSummary {
  score: number;
  bestScore: number;
  coinsEarned: number;
  raccoonsDefeated: number;
  distance: number;
  isNewBest: boolean;
  heroName: string;
  worldName: string;
}

export interface SaveData {
  totalCoins: number;
  totalRaccoons: number;
  bestScore: number;
  selectedHero: HeroId;
  selectedWorld: WorldId;
  unlockedHeroes: HeroId[];
  unlockedWorlds: WorldId[];
  muted: boolean;
}
