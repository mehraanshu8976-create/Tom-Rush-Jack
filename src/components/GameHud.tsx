import { HEROES } from '../game/catalog';
import type { HudSnapshot } from '../game/types';
import {
  GoldPawCoinIcon,
  HeartSocketIcon,
  JetPowerIcon,
  MagnetPowerIcon,
  PauseButtonIcon,
  RaccoonBadgeIcon,
  ShieldPowerIcon,
  SoundButtonIcon,
} from './GameIcons';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onTriggerPower: () => void;
  onMoveLane: (delta: -1 | 1) => void;
  onJump: () => void;
  onSlide: () => void;
}

export function GameHud({
  hud,
  muted,
  onToggleMute,
  onPause,
  onTriggerPower,
  onMoveLane,
  onJump,
  onSlide,
}: GameHudProps) {
  const hero = HEROES[hud.heroId];
  const powerReady = hud.powerCharge >= 100 && hud.powerActiveTimer <= 0;

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top HUD Bar — Matches Screenshot Perimeter Skewed Banners */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left Cluster: Coins, Raccoons KO, Hearts, Hero Power */}
        <div className="flex flex-col gap-2 items-start">
          {/* Gold Paw Coins */}
          <div className="hud-skew bg-slate-900/85 border-2 border-sky-300/80 px-3 py-1 shadow-lg flex items-center gap-2 min-w-[126px]">
            <div className="hud-unskew flex items-center gap-2">
              <GoldPawCoinIcon className="w-6 h-6 shrink-0" />
              <span
                data-testid="hud-coins"
                className="text-lg sm:text-xl font-black text-amber-300 tabular-nums hud-text-stroke"
              >
                {hud.coins.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Raccoons Defeated */}
          <div className="hud-skew bg-slate-900/85 border-2 border-sky-300/80 px-3 py-1 shadow-lg flex items-center gap-2 min-w-[116px]">
            <div className="hud-unskew flex items-center gap-2">
              <RaccoonBadgeIcon className="w-6 h-6 shrink-0" />
              <span
                data-testid="hud-raccoons"
                className="text-base sm:text-lg font-black text-white tabular-nums hud-text-stroke"
              >
                {hud.raccoons}
              </span>
            </div>
          </div>

          {/* 3 Hero Vitality Heart Sockets */}
          <div className="flex items-center gap-1.5 bg-slate-950/75 border border-white/20 rounded-lg px-2.5 py-1">
            {Array.from({ length: hud.maxHearts }).map((_, idx) => (
              <HeartSocketIcon key={idx} filled={idx < hud.hearts} />
            ))}
          </div>

          {/* Hero Super Power Charge */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerPower();
            }}
            disabled={!powerReady}
            aria-label={`Activate ${hero.powerName}`}
            className={`pointer-events-auto hud-skew border-2 px-3 py-1.5 text-left transition-transform ${
              powerReady
                ? 'bg-emerald-500 border-yellow-300 text-slate-950 cursor-pointer hover:scale-105 shadow-[0_0_16px_rgba(74,222,128,0.65)]'
                : 'bg-slate-900/80 border-slate-500/60 text-white cursor-default'
            }`}
          >
            <div className="hud-unskew flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider">
                {hud.powerActiveTimer > 0
                  ? `${hero.powerName} ${hud.powerActiveTimer.toFixed(1)}s`
                  : powerReady
                    ? `[E] ${hero.powerName}!`
                    : `${hero.powerName}`}
              </span>
              <span className="text-xs font-black tabular-nums">
                {hud.powerActiveTimer > 0 ? 'ON' : `${hud.powerCharge}%`}
              </span>
            </div>
            <div className="hud-unskew w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-150 ${
                  hud.powerActiveTimer > 0
                    ? 'bg-amber-300'
                    : powerReady
                      ? 'bg-white'
                      : 'bg-emerald-400'
                }`}
                style={{
                  width: `${hud.powerActiveTimer > 0 ? (hud.powerActiveTimer / 5) * 100 : hud.powerCharge}%`,
                }}
              />
            </div>
          </button>
        </div>

        {/* Top-Center Score Wing Banner */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="hud-skew bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 border-2 border-white px-6 sm:px-9 py-1.5 shadow-[0_6px_0_rgba(15,23,42,0.85)]">
            <div className="hud-unskew text-center">
              <span
                data-testid="hud-score"
                className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight hud-text-stroke"
              >
                {hud.score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Active Power-Up Timers (Compact) */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {hud.shieldTimer > 0 && (
              <div className="flex items-center gap-1 bg-blue-900/90 border border-sky-300 px-2 py-0.5 rounded text-xs font-bold tabular-nums">
                <ShieldPowerIcon className="w-4 h-4" />
                <span>{hud.shieldTimer.toFixed(1)}s</span>
              </div>
            )}
            {hud.magnetTimer > 0 && (
              <div className="flex items-center gap-1 bg-rose-900/90 border border-rose-300 px-2 py-0.5 rounded text-xs font-bold tabular-nums">
                <MagnetPowerIcon className="w-4 h-4" />
                <span>{hud.magnetTimer.toFixed(1)}s</span>
              </div>
            )}
            {hud.jetTimer > 0 && (
              <div className="flex items-center gap-1 bg-cyan-900/90 border border-cyan-300 px-2 py-0.5 rounded text-xs font-bold tabular-nums">
                <JetPowerIcon className="w-4 h-4" />
                <span>{hud.jetTimer.toFixed(1)}s</span>
              </div>
            )}
            {hud.multiplierTimer > 0 && (
              <div className="bg-amber-600/90 border border-yellow-200 px-2 py-0.5 rounded text-xs font-black tabular-nums">
                2X COINS {hud.multiplierTimer.toFixed(1)}s
              </div>
            )}
          </div>
        </div>

        {/* Top-Right Utility Controls: Mute & Glossy Cyan Pause Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="w-11 h-11 rounded-xl bg-slate-900/85 border-2 border-slate-400/70 hover:border-white flex items-center justify-center shadow-lg cursor-pointer transition-transform active:scale-95"
          >
            <SoundButtonIcon muted={muted} className="w-6 h-6" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            data-testid="hud-pause"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            aria-label="Pause game"
            className="w-12 h-12 rounded-xl bg-sky-400 hover:bg-sky-300 border-2 border-white shadow-[0_4px_0_#0369a1] flex items-center justify-center cursor-pointer transition-transform active:translate-y-0.5"
          >
            <PauseButtonIcon className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Bottom Corner Touch / Click Action Controls (compact, leaves center 85%+ clear) */}
      <div className="flex items-end justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto sm:opacity-75 hover:opacity-100">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onMoveLane(-1);
            }}
            aria-label="Move left lane"
            className="w-12 h-12 rounded-xl bg-slate-900/75 border-2 border-white/30 text-white font-black text-lg flex items-center justify-center cursor-pointer active:scale-95"
          >
            ◀
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onMoveLane(1);
            }}
            aria-label="Move right lane"
            className="w-12 h-12 rounded-xl bg-slate-900/75 border-2 border-white/30 text-white font-black text-lg flex items-center justify-center cursor-pointer active:scale-95"
          >
            ▶
          </button>
        </div>

        <div className="hidden md:block text-xs font-semibold text-white/75 tracking-wide hud-text-stroke">
          {hud.distance}m · {hud.speed} km/h
        </div>

        <div className="flex items-center gap-2 pointer-events-auto sm:opacity-75 hover:opacity-100">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onSlide();
            }}
            aria-label="Slide"
            className="px-3.5 h-12 rounded-xl bg-slate-900/75 border-2 border-amber-300/60 text-amber-200 font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95"
          >
            Slide
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onJump();
            }}
            aria-label="Jump"
            className="px-4 h-12 rounded-xl bg-sky-500/85 border-2 border-white text-white font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95"
          >
            Jump
          </button>
        </div>
      </div>
    </div>
  );
}
