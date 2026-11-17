import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { LobbyScreen } from './components/LobbyScreen';
import { StatusModal } from './components/StatusModal';
import { soundEngine } from './game/audio';
import { HEROES, loadSaveData, persistSaveData, WORLDS } from './game/catalog';
import { canAffordAndUnlockHero, canAffordAndUnlockWorld } from './game/engineLogic';
import { RunnerCanvas, type RunnerControlBridge } from './game/RunnerCanvas';
import type { GameState, HeroId, HudSnapshot, RunSummary, SaveData, WorldId } from './game/types';

function getInitialState(): GameState {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return 'playing';
    }
  }
  return 'title';
}

function makeInitialHud(save: SaveData): HudSnapshot {
  return {
    score: 0,
    coins: 0,
    raccoons: 0,
    hearts: 3,
    maxHearts: 3,
    powerCharge: 35,
    powerActiveTimer: 0,
    shieldTimer: 0,
    magnetTimer: 0,
    jetTimer: 0,
    multiplierTimer: 0,
    distance: 0,
    speed: 18,
    worldId: save.selectedWorld,
    heroId: save.selectedHero,
    comboCount: 0,
  };
}

export default function App() {
  const [save, setSave] = useState<SaveData>(() => {
    const loaded = loadSaveData();
    soundEngine.setMuted(loaded.muted);
    return loaded;
  });
  const [gameState, setGameState] = useState<GameState>(getInitialState);
  const [runNonce, setRunNonce] = useState(0);
  const [hud, setHud] = useState<HudSnapshot>(() => makeInitialHud(save));
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const bridgeRef = useRef<RunnerControlBridge | null>(null);

  // Sync document.body.dataset.state cleanly
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Persist save changes
  useEffect(() => {
    persistSaveData(save);
    soundEngine.setMuted(save.muted);
  }, [save]);

  const focusCanvas = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const canvas = document.querySelector('canvas');
    if (canvas instanceof HTMLElement) {
      canvas.focus();
    }
  }, []);

  const handleStartGame = useCallback(() => {
    soundEngine.playClick();
    setRunSummary(null);
    setRunNonce((n) => n + 1);
    document.body.dataset.state = 'playing';
    setGameState('playing');
    focusCanvas();
  }, [focusCanvas]);

  const handlePauseToggle = useCallback(() => {
    soundEngine.playClick();
    setGameState((prev) => {
      if (prev === 'playing') {
        document.body.dataset.state = 'paused';
        return 'paused';
      }
      if (prev === 'paused') {
        document.body.dataset.state = 'playing';
        focusCanvas();
        return 'playing';
      }
      return prev;
    });
  }, [focusCanvas]);

  const handleBackToLobby = useCallback(() => {
    soundEngine.playClick();
    bridgeRef.current?.resetRun();
    setRunSummary(null);
    document.body.dataset.state = 'title';
    setGameState('title');
  }, []);

  const handleGameOver = useCallback(
    (snapshot: HudSnapshot) => {
      setSave((prev) => {
        const isNewBest = snapshot.score > prev.bestScore;
        const bestScore = Math.max(prev.bestScore, snapshot.score);
        setRunSummary({
          score: snapshot.score,
          bestScore,
          coinsEarned: snapshot.coins,
          raccoonsDefeated: snapshot.raccoons,
          distance: snapshot.distance,
          isNewBest,
          heroName: HEROES[prev.selectedHero].name,
          worldName: WORLDS[prev.selectedWorld].name,
        });
        return {
          ...prev,
          totalCoins: prev.totalCoins + snapshot.coins,
          totalRaccoons: prev.totalRaccoons + snapshot.raccoons,
          bestScore,
        };
      });
      document.body.dataset.state = 'gameover';
      setGameState('gameover');
    },
    [],
  );

  const handleToggleMute = useCallback(() => {
    setSave((prev) => ({ ...prev, muted: !prev.muted }));
  }, []);

  const handleSelectOrUnlockHero = useCallback((heroId: HeroId) => {
    soundEngine.playClick();
    setSave((prev) => {
      const res = canAffordAndUnlockHero(prev, heroId);
      return res.ok ? res.nextSave : prev;
    });
  }, []);

  const handleSelectOrUnlockWorld = useCallback((worldId: WorldId) => {
    soundEngine.playClick();
    setSave((prev) => {
      const res = canAffordAndUnlockWorld(prev, worldId);
      return res.ok ? res.nextSave : prev;
    });
  }, []);

  // Global keyboard shortcuts for Title, Pause, and Mute
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        handleToggleMute();
        return;
      }
      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStartGame();
      } else if (gameState === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) {
        e.preventDefault();
        handlePauseToggle();
      } else if (gameState === 'gameover' && e.code === 'Enter') {
        e.preventDefault();
        handleStartGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, handlePauseToggle, handleStartGame, handleToggleMute]);

  return (
    <main className="relative w-full h-full overflow-hidden bg-slate-950">
      <RunnerCanvas
        gameState={gameState}
        heroId={save.selectedHero}
        worldId={save.selectedWorld}
        runNonce={runNonce}
        onHudUpdate={setHud}
        onGameOver={handleGameOver}
        onPauseToggle={handlePauseToggle}
        bridgeRef={bridgeRef}
      />

      {gameState === 'title' && (
        <LobbyScreen
          save={save}
          onSelectOrUnlockHero={handleSelectOrUnlockHero}
          onSelectOrUnlockWorld={handleSelectOrUnlockWorld}
          onStartGame={handleStartGame}
          onToggleMute={handleToggleMute}
        />
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHud
          hud={hud}
          muted={save.muted}
          onToggleMute={handleToggleMute}
          onPause={handlePauseToggle}
          onTriggerPower={() => bridgeRef.current?.triggerPower()}
          onMoveLane={(d) => bridgeRef.current?.moveLane(d)}
          onJump={() => bridgeRef.current?.jump()}
          onSlide={() => bridgeRef.current?.slide()}
        />
      )}

      <StatusModal
        gameState={gameState}
        runSummary={runSummary}
        onResume={handlePauseToggle}
        onRestart={handleStartGame}
        onBackToLobby={handleBackToLobby}
      />
    </main>
  );
}
