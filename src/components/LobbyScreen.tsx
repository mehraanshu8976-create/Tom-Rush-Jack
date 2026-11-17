import { useEffect, useState } from 'react';
import { GALLERY_PICTURES, HERO_LIST, HEROES, WORLD_LIST, WORLDS } from '../game/catalog';
import type { GalleryPicture, HeroId, SaveData, WorldId } from '../game/types';
import {
  GoldPawCoinIcon,
  RaccoonBadgeIcon,
  SoundButtonIcon,
  TomRushJackEmblem,
} from './GameIcons';

interface LobbyScreenProps {
  save: SaveData;
  onSelectOrUnlockHero: (heroId: HeroId) => void;
  onSelectOrUnlockWorld: (worldId: WorldId) => void;
  onStartGame: () => void;
  onToggleMute: () => void;
}

type LobbyTab = 'heroes' | 'worlds' | 'gallery';

export function LobbyScreen({
  save,
  onSelectOrUnlockHero,
  onSelectOrUnlockWorld,
  onStartGame,
  onToggleMute,
}: LobbyScreenProps) {
  const [activeTab, setActiveTab] = useState<LobbyTab>('heroes');
  const [slideIdx, setSlideIdx] = useState(0);
  const [previewPic, setPreviewPic] = useState<GalleryPicture | null>(null);

  // Auto-advance the animated Lobby Picture Showcase every 4 seconds
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % GALLERY_PICTURES.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  const currentHero = HEROES[save.selectedHero];
  const currentWorld = WORLDS[save.selectedWorld];
  const featuredPic = GALLERY_PICTURES[slideIdx];

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar: Title Emblem + Bank Totals + Mute */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="pointer-events-auto flex flex-col items-start gap-2">
          <TomRushJackEmblem />
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="hud-skew bg-slate-950/85 border-2 border-amber-400/90 px-3.5 py-1 shadow-lg">
              <div className="hud-unskew flex items-center gap-2">
                <GoldPawCoinIcon className="w-6 h-6" />
                <span data-testid="lobby-coins" className="text-lg font-black text-amber-300 tabular-nums">
                  {save.totalCoins.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="hud-skew bg-slate-950/85 border-2 border-sky-400/80 px-3.5 py-1 shadow-lg">
              <div className="hud-unskew flex items-center gap-2">
                <RaccoonBadgeIcon className="w-6 h-6" />
                <span className="text-lg font-black text-white tabular-nums">
                  {save.totalRaccoons.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="hud-skew bg-slate-950/85 border-2 border-emerald-400/70 px-3.5 py-1 shadow-lg">
              <div className="hud-unskew flex items-center gap-1.5 text-sm font-black text-emerald-300 tabular-nums">
                <span className="text-white/75 text-xs uppercase">Best</span>
                <span>{save.bestScore.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right Animated Picture Showcase Card + Mute */}
        <div className="flex items-start gap-3 pointer-events-auto">
          <div className="hidden lg:flex flex-col w-60 bg-slate-950/85 border-2 border-sky-400/80 rounded-2xl overflow-hidden shadow-2xl animate-float-card">
            <button
              type="button"
              onClick={() => setPreviewPic(featuredPic)}
              aria-label={`Inspect ${featuredPic.title}`}
              className="relative h-32 w-full overflow-hidden cursor-pointer group block"
            >
              <img
                key={featuredPic.id}
                src={featuredPic.imageUrl}
                alt={featuredPic.title}
                className="w-full h-full object-cover animate-ken-burns transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                {featuredPic.tag}
              </span>
              <span className="absolute bottom-2 left-2 right-2 text-left text-xs font-extrabold text-white drop-shadow">
                {featuredPic.title}
              </span>
            </button>
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/95">
              <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                Action Reel {slideIdx + 1}/{GALLERY_PICTURES.length}
              </span>
              <div className="flex gap-1">
                {GALLERY_PICTURES.map((pic, i) => (
                  <button
                    key={pic.id}
                    type="button"
                    aria-label={`Show picture ${i + 1}`}
                    onClick={() => setSlideIdx(i)}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                      i === slideIdx ? 'bg-amber-400' : 'bg-slate-600 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={save.muted ? 'Unmute audio' : 'Mute audio'}
            className="w-11 h-11 rounded-xl bg-slate-950/85 border-2 border-white/30 hover:border-white flex items-center justify-center shadow-lg cursor-pointer"
          >
            <SoundButtonIcon muted={save.muted} className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bottom Dock: Compact Hero / World / Pictures Selector + Primary RUN CTA */}
      <div className="flex flex-col items-center gap-3 w-full max-w-5xl mx-auto pointer-events-auto">
        <div className="w-full bg-slate-950/88 border-2 border-sky-400/75 rounded-2xl p-3 sm:p-4 shadow-2xl">
          {/* Tabs + Active Summary + Start CTA */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('heroes')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-colors ${
                  activeTab === 'heroes'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Heroes ({save.unlockedHeroes.length}/{HERO_LIST.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('worlds')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-colors ${
                  activeTab === 'worlds'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Worlds ({save.unlockedWorlds.length}/{WORLD_LIST.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-colors ${
                  activeTab === 'gallery'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Pictures ({GALLERY_PICTURES.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-black text-sky-300 uppercase tracking-wider">
                  {currentHero.name} · {currentWorld.name}
                </div>
                <div className="text-[11px] text-slate-300">{currentHero.powerName}</div>
              </div>

              <button
                type="button"
                data-start="true"
                onClick={onStartGame}
                className="px-7 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-base uppercase tracking-wider border-2 border-white shadow-[0_4px_0_#15803d] cursor-pointer transition-transform active:translate-y-0.5"
              >
                Run Now
              </button>
            </div>
          </div>

          {/* Tab Body */}
          {activeTab === 'heroes' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {HERO_LIST.map((hero) => {
                const unlocked = save.unlockedHeroes.includes(hero.id);
                const selected = save.selectedHero === hero.id;
                const affordable = save.totalCoins >= hero.cost;
                return (
                  <button
                    key={hero.id}
                    type="button"
                    onClick={() => onSelectOrUnlockHero(hero.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      selected
                        ? 'bg-sky-900/75 border-amber-300 shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                        : unlocked
                          ? 'bg-slate-900/85 border-slate-700 hover:border-sky-400'
                          : affordable
                            ? 'bg-slate-900/85 border-emerald-500/70 hover:border-emerald-400'
                            : 'bg-slate-900/60 border-slate-800 opacity-75'
                    }`}
                  >
                    <img
                      src={hero.previewImage}
                      alt={hero.name}
                      className="w-12 h-12 rounded-lg object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate">{hero.name}</div>
                      <div className="text-[10px] font-bold text-sky-300 truncate">{hero.powerName}</div>
                      <div className="mt-1">
                        {selected ? (
                          <span className="text-[10px] font-black text-amber-300 uppercase">Selected</span>
                        ) : unlocked ? (
                          <span className="text-[10px] font-bold text-emerald-300 uppercase">Ready</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300 tabular-nums">
                            <GoldPawCoinIcon className="w-3.5 h-3.5" />
                            {hero.cost} Unlock
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'worlds' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {WORLD_LIST.map((world) => {
                const unlocked = save.unlockedWorlds.includes(world.id);
                const selected = save.selectedWorld === world.id;
                const affordable = save.totalCoins >= world.cost;
                return (
                  <button
                    key={world.id}
                    type="button"
                    onClick={() => onSelectOrUnlockWorld(world.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      selected
                        ? 'bg-amber-900/60 border-amber-300 shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                        : unlocked
                          ? 'bg-slate-900/85 border-slate-700 hover:border-amber-400'
                          : affordable
                            ? 'bg-slate-900/85 border-emerald-500/70 hover:border-emerald-400'
                            : 'bg-slate-900/60 border-slate-800 opacity-75'
                    }`}
                  >
                    <img
                      src={world.previewImage}
                      alt={world.name}
                      className="w-12 h-12 rounded-lg object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate">{world.name}</div>
                      <div className="text-[10px] text-slate-300 truncate">{world.subtitle}</div>
                      <div className="mt-1">
                        {selected ? (
                          <span className="text-[10px] font-black text-amber-300 uppercase">Active</span>
                        ) : unlocked ? (
                          <span className="text-[10px] font-bold text-emerald-300 uppercase">Open</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300 tabular-nums">
                            <GoldPawCoinIcon className="w-3.5 h-3.5" />
                            {world.cost} Unlock
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {GALLERY_PICTURES.map((pic, i) => (
                <button
                  key={pic.id}
                  type="button"
                  onClick={() => {
                    setSlideIdx(i);
                    setPreviewPic(pic);
                  }}
                  className="group relative h-20 rounded-xl overflow-hidden border-2 border-slate-700 hover:border-amber-300 cursor-pointer transition-transform hover:-translate-y-1"
                >
                  <img
                    src={pic.imageUrl}
                    alt={pic.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] font-black text-white truncate text-left">
                    {pic.tag}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Flat Single-Line Control Hint */}
        <div className="text-xs font-bold text-white/90 tracking-wide hud-text-stroke text-center">
          A/D or ←/→ Lane · Space/W Jump · S Slide · E Super Power · Esc Pause
        </div>
      </div>

      {/* Animated Picture Lightbox Modal when user clicks a gallery image */}
      {previewPic && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/85 pointer-events-auto flex items-center justify-center p-4"
          onClick={() => setPreviewPic(null)}
        >
          <div
            className="bg-slate-900 border-2 border-sky-400 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-80 overflow-hidden bg-slate-950">
              <img
                src={previewPic.imageUrl}
                alt={previewPic.title}
                className="w-full h-full object-contain animate-ken-burns"
              />
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black text-rose-400 uppercase tracking-wider">
                  {previewPic.tag}
                </div>
                <div className="text-base font-black text-white">{previewPic.title}</div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPic(null)}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
