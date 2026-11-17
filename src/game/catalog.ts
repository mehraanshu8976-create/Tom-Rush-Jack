import type { GalleryPicture, HeroConfig, HeroId, SaveData, WorldConfig, WorldId } from './types';

export const LANE_WIDTH = 3.2;
export const GRAVITY = -38;
export const JUMP_VELOCITY = 15.2;
export const BASE_SPEED = 18.5;
export const MAX_SPEED = 37.5;

export const GALLERY_PICTURES: GalleryPicture[] = [
  {
    id: 'pic_squad',
    title: 'Hero Squad vs Raccoon Mech',
    tag: 'HERO ACTION',
    imageUrl: '/assets/aistudio/Screenshot_2026-11-17-10-50-23-24_b5a5c5cb02ca09c784c5d88160e2ec24_58d0d161.jpg',
    worldId: 'metro_city',
    heroId: 'jack_tom',
  },
  {
    id: 'pic_beach',
    title: 'Sunset Hover-Bike Surge',
    tag: 'SUNSET BEACH',
    imageUrl: '/assets/aistudio/Screenshot_2026-11-17-10-50-02-20_b5a5c5cb02ca09c784c5d88160e2ec24_c102ad7a.jpg',
    worldId: 'sunset_beach',
    heroId: 'hover_ben',
  },
  {
    id: 'pic_zap',
    title: 'Cyber Zap Shockwave Slam',
    tag: 'CRANE ZONE',
    imageUrl: '/assets/aistudio/Screenshot_2026-11-17-10-50-10-28_b5a5c5cb02ca09c784c5d88160e2ec24_346123b8.jpg',
    worldId: 'metro_city',
    heroId: 'cyber_tom',
  },
  {
    id: 'pic_arctic',
    title: 'Arctic Crystal Dash',
    tag: 'ARCTIC CANYON',
    imageUrl: '/assets/aistudio/Screenshot_2026-11-17-10-50-06-87_b5a5c5cb02ca09c784c5d88160e2ec24_45c5d50e.jpg',
    worldId: 'arctic_canyon',
    heroId: 'jack_tom',
  },
  {
    id: 'pic_smash',
    title: 'Hyper Green Smash Blast',
    tag: 'METRO RUSH',
    imageUrl: '/assets/aistudio/Screenshot_2026-11-17-10-50-13-81_b5a5c5cb02ca09c784c5d88160e2ec24_5209838f.jpg',
    worldId: 'metro_city',
    heroId: 'jack_tom',
  },
  {
    id: 'pic_temple',
    title: 'Pharaoh Vault Shield Run',
    tag: 'PHARAOH TEMPLE',
    imageUrl: '/assets/aistudio/Screenshot_2026-11-17-10-50-18-21_b5a5c5cb02ca09c784c5d88160e2ec24_4b28509f.jpg',
    worldId: 'pharaoh_temple',
    heroId: 'cyber_tom',
  },
];

export const HEROES: Record<HeroId, HeroConfig> = {
  jack_tom: {
    id: 'jack_tom',
    name: 'Jack Tom',
    codename: 'STRIKER RED',
    powerName: 'Hyper Smash',
    powerDesc: 'Unleashes a neon-green shockwave blasting all raccoons & barriers ahead.',
    cost: 0,
    primaryColor: 0xe11d48,
    secondaryColor: 0xfacc15,
    accentColor: 0x22c55e,
    auraColor: 0x4ade80,
    furColor: 0x8a929e,
    hasCape: false,
    hasHelmet: false,
    hasHoverBike: false,
    speedBonus: 1.0,
    magnetBonus: 0,
    coinMultiplier: 1,
    previewImage: GALLERY_PICTURES[0].imageUrl,
  },
  cyber_tom: {
    id: 'cyber_tom',
    name: 'Cyber Tom',
    codename: 'ARMOR BLUE',
    powerName: 'Electro Slam',
    powerDesc: 'Triggers an electric cyan storm that zaps raccoons and draws nearby coins.',
    cost: 80,
    primaryColor: 0x2563eb,
    secondaryColor: 0xe2e8f0,
    accentColor: 0x06b6d4,
    auraColor: 0x38bdf8,
    furColor: 0x94a3b8,
    hasCape: false,
    hasHelmet: true,
    hasHoverBike: false,
    speedBonus: 1.04,
    magnetBonus: 2.0,
    coinMultiplier: 1,
    previewImage: GALLERY_PICTURES[2].imageUrl,
  },
  jet_angela: {
    id: 'jet_angela',
    name: 'Jet Angela',
    codename: 'STAR MAGENTA',
    powerName: 'Prism Jet',
    powerDesc: 'Boosts forward with magenta wing aura & +25% coin magnetism.',
    cost: 150,
    primaryColor: 0xdb2777,
    secondaryColor: 0xfbbf24,
    accentColor: 0xc084fc,
    auraColor: 0xf472b6,
    furColor: 0xf8fafc,
    hasCape: true,
    hasHelmet: false,
    hasHoverBike: false,
    speedBonus: 1.06,
    magnetBonus: 2.8,
    coinMultiplier: 1,
    previewImage: GALLERY_PICTURES[0].imageUrl,
  },
  hover_ben: {
    id: 'hover_ben',
    name: 'Hover Jack',
    codename: 'TURBO PILOT',
    powerName: 'Hover Overdrive',
    powerDesc: 'Rides an orange/blue twin-rotor hover-bike with blazing cyan turbo flame.',
    cost: 240,
    primaryColor: 0x1d4ed8,
    secondaryColor: 0xf97316,
    accentColor: 0x22d3ee,
    auraColor: 0x38bdf8,
    furColor: 0xe2e8f0,
    hasCape: false,
    hasHelmet: true,
    hasHoverBike: true,
    speedBonus: 1.1,
    magnetBonus: 1.5,
    coinMultiplier: 2,
    previewImage: GALLERY_PICTURES[1].imageUrl,
  },
};

export const HERO_LIST: HeroConfig[] = [
  HEROES.jack_tom,
  HEROES.cyber_tom,
  HEROES.jet_angela,
  HEROES.hover_ben,
];

export const WORLDS: Record<WorldId, WorldConfig> = {
  metro_city: {
    id: 'metro_city',
    name: 'Metro City',
    subtitle: 'Skyscraper Rush & Construction Cranes',
    cost: 0,
    skyTop: 0x2563eb,
    skyBottom: 0x93c5fd,
    fogColor: 0x93c5fd,
    roadColor: 0x2a3142,
    stripeColor: 0xf8fafc,
    curbColor: 0xf97316,
    groundColor: 0x4ade80,
    accentColor: 0xfacc15,
    lightWarm: 0xfff3d6,
    hemiSky: 0xbae6fd,
    hemiGround: 0x334155,
    previewImage: GALLERY_PICTURES[4].imageUrl,
  },
  sunset_beach: {
    id: 'sunset_beach',
    name: 'Sunset Beach',
    subtitle: 'Neon Ramps & Tropical Palms',
    cost: 0,
    skyTop: 0xdb2777,
    skyBottom: 0xfb923c,
    fogColor: 0xf472b6,
    roadColor: 0x3b2449,
    stripeColor: 0xfef08a,
    curbColor: 0xf43f5e,
    groundColor: 0xfdba74,
    accentColor: 0x22d3ee,
    lightWarm: 0xffedd5,
    hemiSky: 0xf9a8d4,
    hemiGround: 0x4c1d95,
    previewImage: GALLERY_PICTURES[1].imageUrl,
  },
  arctic_canyon: {
    id: 'arctic_canyon',
    name: 'Arctic Canyon',
    subtitle: 'Crystal Glacier & Blizzard Pass',
    cost: 100,
    skyTop: 0x0ea5e9,
    skyBottom: 0xe0f2fe,
    fogColor: 0xcbd5e1,
    roadColor: 0x38bdf8,
    stripeColor: 0xffffff,
    curbColor: 0x9333ea,
    groundColor: 0xe2e8f0,
    accentColor: 0xa855f7,
    lightWarm: 0xfef9c3,
    hemiSky: 0xe0f2fe,
    hemiGround: 0x475569,
    previewImage: GALLERY_PICTURES[3].imageUrl,
  },
  pharaoh_temple: {
    id: 'pharaoh_temple',
    name: 'Pharaoh Temple',
    subtitle: 'Golden Statues & Ancient Vaults',
    cost: 180,
    skyTop: 0x3b82f6,
    skyBottom: 0xfde68a,
    fogColor: 0xd97706,
    roadColor: 0x3b1f3a,
    stripeColor: 0xf59e0b,
    curbColor: 0xd97706,
    groundColor: 0xf59e0b,
    accentColor: 0xfacc15,
    lightWarm: 0xfef3c7,
    hemiSky: 0xfde68a,
    hemiGround: 0x451a03,
    previewImage: GALLERY_PICTURES[5].imageUrl,
  },
};

export const WORLD_LIST: WorldConfig[] = [
  WORLDS.metro_city,
  WORLDS.sunset_beach,
  WORLDS.arctic_canyon,
  WORLDS.pharaoh_temple,
];

export const DEFAULT_SAVE_DATA: SaveData = {
  totalCoins: 100,
  totalRaccoons: 0,
  bestScore: 0,
  selectedHero: 'jack_tom',
  selectedWorld: 'metro_city',
  unlockedHeroes: ['jack_tom'],
  unlockedWorlds: ['metro_city', 'sunset_beach'],
  muted: false,
};

export const SAVE_STORAGE_KEY = 'tom_rush_jack_save_v1';

export function loadSaveData(): SaveData {
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE_DATA };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      totalCoins: typeof parsed.totalCoins === 'number' ? Math.max(0, Math.floor(parsed.totalCoins)) : DEFAULT_SAVE_DATA.totalCoins,
      totalRaccoons: typeof parsed.totalRaccoons === 'number' ? Math.max(0, Math.floor(parsed.totalRaccoons)) : 0,
      bestScore: typeof parsed.bestScore === 'number' ? Math.max(0, Math.floor(parsed.bestScore)) : 0,
      selectedHero: parsed.selectedHero && HEROES[parsed.selectedHero] ? parsed.selectedHero : 'jack_tom',
      selectedWorld: parsed.selectedWorld && WORLDS[parsed.selectedWorld] ? parsed.selectedWorld : 'metro_city',
      unlockedHeroes: Array.isArray(parsed.unlockedHeroes) && parsed.unlockedHeroes.length > 0
        ? Array.from(new Set(['jack_tom', ...parsed.unlockedHeroes])) as HeroId[]
        : ['jack_tom'],
      unlockedWorlds: Array.isArray(parsed.unlockedWorlds) && parsed.unlockedWorlds.length > 0
        ? Array.from(new Set(['metro_city', 'sunset_beach', ...parsed.unlockedWorlds])) as WorldId[]
        : ['metro_city', 'sunset_beach'],
      muted: Boolean(parsed.muted),
    };
  } catch {
    return { ...DEFAULT_SAVE_DATA };
  }
}

export function persistSaveData(data: SaveData): void {
  try {
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}
