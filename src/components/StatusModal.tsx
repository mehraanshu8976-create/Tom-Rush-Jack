import type { GameState, RunSummary } from '../game/types';
import { GoldPawCoinIcon, RaccoonBadgeIcon } from './GameIcons';

interface StatusModalProps {
  gameState: GameState;
  runSummary: RunSummary | null;
  onResume: () => void;
  onRestart: () => void;
  onBackToLobby: () => void;
}

export function StatusModal({
  gameState,
  runSummary,
  onResume,
  onRestart,
  onBackToLobby,
}: StatusModalProps) {
  if (gameState !== 'paused' && gameState !== 'gameover') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/75 flex items-center justify-center p-4 pointer-events-auto">
      <div className="w-full max-w-md bg-slate-900 border-2 border-sky-400 rounded-2xl p-6 shadow-2xl text-center">
        {gameState === 'paused' ? (
          <>
            <h2 className="text-3xl font-black italic text-white uppercase tracking-wide hud-text-stroke">
              Game Paused
            </h2>
            <p className="text-sm text-sky-200 mt-1 mb-6">
              Catch your breath before diving back into the rush.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black uppercase tracking-wider border-2 border-white shadow-[0_4px_0_#15803d] cursor-pointer"
              >
                Resume Run
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black uppercase tracking-wider border-2 border-sky-200 cursor-pointer"
              >
                Restart Track
              </button>
              <button
                type="button"
                onClick={onBackToLobby}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase tracking-wider border border-slate-600 cursor-pointer"
              >
                Back to Lobby
              </button>
            </div>
          </>
        ) : (
          runSummary && (
            <>
              <div className="inline-block px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 text-xs font-black uppercase tracking-wider mb-2">
                {runSummary.isNewBest ? 'New High Score!' : 'Run Complete'}
              </div>
              <h2 className="text-3xl font-black italic text-white uppercase tracking-wide hud-text-stroke">
                {runSummary.heroName}
              </h2>
              <p className="text-xs font-bold text-sky-300 uppercase tracking-widest mt-0.5 mb-5">
                {runSummary.worldName} · {runSummary.distance}m Dashed
              </p>

              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="bg-slate-950/90 border border-sky-500/40 rounded-xl p-3">
                  <div className="text-[10px] font-black text-sky-300 uppercase">Score</div>
                  <div className="text-xl font-black text-white tabular-nums mt-1">
                    {runSummary.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                    Best {runSummary.bestScore.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3 flex flex-col items-center">
                  <div className="text-[10px] font-black text-amber-300 uppercase">Coins</div>
                  <div className="flex items-center gap-1 mt-1">
                    <GoldPawCoinIcon className="w-5 h-5" />
                    <span className="text-xl font-black text-amber-300 tabular-nums">
                      +{runSummary.coinsEarned}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-3 flex flex-col items-center">
                  <div className="text-[10px] font-black text-emerald-300 uppercase">Bandits</div>
                  <div className="flex items-center gap-1 mt-1">
                    <RaccoonBadgeIcon className="w-5 h-5" />
                    <span className="text-xl font-black text-white tabular-nums">
                      {runSummary.raccoonsDefeated}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  data-start="true"
                  onClick={onRestart}
                  className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black uppercase tracking-wider border-2 border-white shadow-[0_4px_0_#15803d] cursor-pointer"
                >
                  Run Again
                </button>
                <button
                  type="button"
                  onClick={onBackToLobby}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-wider border border-sky-300 cursor-pointer"
                >
                  Hero & World Lobby
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
