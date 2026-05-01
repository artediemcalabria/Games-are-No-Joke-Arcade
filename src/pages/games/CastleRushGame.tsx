import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Bell, Coffee, Clock, Flame, Focus, Gamepad2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';

type Cell = 'wall' | 'floor' | 'dot' | 'start' | 'exit' | 'room' | 'checkpoint' | 'coffee' | 'focus' | 'bell';
type Point = { x: number; y: number };
type ClockEnemy = { id: number; path: Point[]; step: number; direction: 1 | -1; alertUntil: number };
type GameState = 'intro' | 'playing' | 'paused' | 'won-level' | 'game-over' | 'completed';
type TokenKind = 'coffee' | 'focus' | 'bell';
type ActivityRoom = { x: number; y: number; width: number; height: number; goal: Point };
type LevelTemplate = {
  title: string;
  time: number;
  hitPenalty: number;
  clockSpeed: number;
  rows: string[];
  patrols: Point[][];
};

const game = gameCatalog.find((item) => item.id === 'castle-rush')!;
const maxLevel = 10;
const directions = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const designNotes = [
  'Level 1: Readable enemies are fairer than random enemies.',
  'Level 2: A safe zone lets players pause and plan.',
  'Level 3: A shortcut is meaningful when it has a visible risk.',
  'Level 4: Checkpoints make pressure tense without becoming unfair.',
  'Level 5: A useful pickup gives players a new decision, not only a bonus.',
  'Level 6: Alert enemies work best when players can predict their limits.',
  'Level 7: A hard route still needs recovery space.',
  'Level 8: Difficulty should ask for better timing, not blind luck.',
  'Level 9: Good pressure gives players choices, not only punishment.',
  'Level 10: Fair level design makes victory feel earned.',
];

const tokenLabels: Record<TokenKind, string> = {
  coffee: 'Coffee Token: steady rhythm active. Clocks slow down briefly.',
  focus: 'Focus Token: clocks frozen for a moment.',
  bell: 'Bell Token: safest path revealed.',
};

export default function CastleRushGame() {
  const { completeGame, saveGameNote, updatePrototypeField } = useStore();
  const [level, setLevel] = useState(1);
  const [highestLevel, setHighestLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>('intro');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [tick, setTick] = useState(0);
  const [timeLeft, setTimeLeft] = useState(levelTemplates[0].time);
  const [angerPenalty, setAngerPenalty] = useState(0);
  const [lastEvent, setLastEvent] = useState('Reach the Activity Room. Clocks punish mistakes, but they do not block the only route.');
  const [collectedTokens, setCollectedTokens] = useState<Set<string>>(new Set());
  const [activeUntil, setActiveUntil] = useState<Record<TokenKind, number>>({ coffee: 0, focus: 0, bell: 0 });
  const audioRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<number | null>(null);

  const levelData = useMemo(() => parseLevel(levelTemplates[level - 1]), [level]);
  const [player, setPlayer] = useState<Point>(levelData.start);
  const [checkpoint, setCheckpoint] = useState<Point>(levelData.start);
  const [clocks, setClocks] = useState<ClockEnemy[]>(levelData.clocks);
  const nowTick = tick;
  const activeCoffee = activeUntil.coffee > nowTick;
  const activeFocus = activeUntil.focus > nowTick;
  const activeBell = activeUntil.bell > nowTick;
  const anger = Math.min(100, Math.round(((levelData.time - timeLeft) / levelData.time) * 72 + angerPenalty));
  const safePath = useMemo(() => (activeBell ? findPath(levelData.grid, player, levelData.room.goal) : []), [activeBell, levelData.grid, levelData.room.goal, player]);

  const playTone = useCallback((frequency: number, duration = 0.08, type: OscillatorType = 'square') => {
    if (!audioEnabled) return;
    const context = audioRef.current ?? new AudioContext();
    audioRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.04, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }, [audioEnabled]);

  const resetLevel = useCallback((nextLevel = level) => {
    const parsed = parseLevel(levelTemplates[nextLevel - 1]);
    setLevel(nextLevel);
    setPlayer(parsed.start);
    setCheckpoint(parsed.start);
    setClocks(parsed.clocks);
    setTimeLeft(parsed.time);
    setAngerPenalty(0);
    setCollectedTokens(new Set());
    setActiveUntil({ coffee: 0, focus: 0, bell: 0 });
    setTick(0);
    setLastEvent('Plan your route. Checkpoints and pickups make the pressure fair.');
    setGameState('playing');
    saveGameNote(game.id, `Castle Rush: reached level ${nextLevel}/10`);
  }, [level, saveGameNote]);

  const finishLevel = useCallback(() => {
    const finalLevel = level >= maxLevel;
    playTone(finalLevel ? 880 : 660, 0.16, 'sine');
    if (finalLevel) {
      setGameState('completed');
      setHighestLevel(maxLevel);
      completeGame(game.id, 1000, game.takeaway, `Castle Rush completed: ${designNotes[maxLevel - 1]}`);
    } else {
      setGameState('won-level');
      setHighestLevel((current) => Math.max(current, level + 1));
      saveGameNote(game.id, `Castle Rush: completed level ${level}/10 - ${designNotes[level - 1]}`);
    }
  }, [completeGame, level, playTone, saveGameNote]);

  const handleClockHit = useCallback(() => {
    playTone(110, 0.16, 'sawtooth');
    const penalty = levelData.hitPenalty;
    setPlayer(checkpoint);
    setClocks(levelData.clocks);
    setTimeLeft((current) => Math.max(1, current - Math.ceil(penalty / 3)));
    setAngerPenalty((current) => Math.min(96, current + penalty));
    setLastEvent(level <= 5
      ? 'Late pass used. You lost time and returned to the checkpoint.'
      : 'Big late pass penalty. The level is still recoverable if you stay calm.');
  }, [checkpoint, level, levelData.clocks, levelData.hitPenalty, playTone]);

  const collectToken = useCallback((kind: TokenKind, point: Point) => {
    const key = `${point.x},${point.y}`;
    setCollectedTokens((current) => new Set([...current, key]));
    setActiveUntil((current) => ({
      ...current,
      [kind]: nowTick + (kind === 'coffee' ? 18 : kind === 'focus' ? 10 : 12),
    }));
    setLastEvent(tokenLabels[kind]);
    playTone(kind === 'coffee' ? 720 : kind === 'focus' ? 520 : 640, 0.08, 'sine');
  }, [nowTick, playTone]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;
    const steps = 1;
    setPlayer((current) => {
      let nextPosition = current;
      for (let index = 0; index < steps; index++) {
        const next = { x: nextPosition.x + dx, y: nextPosition.y + dy };
        const nextCell = levelData.grid[next.y]?.[next.x];
        if (!nextCell || nextCell === 'wall') break;
        nextPosition = next;
        if (nextCell === 'room' || nextCell === 'exit' || same(next, levelData.room.goal)) {
          window.setTimeout(finishLevel, 0);
          break;
        }
      }

      const cell = levelData.grid[nextPosition.y]?.[nextPosition.x];
      const tokenKey = `${nextPosition.x},${nextPosition.y}`;
      if (cell === 'checkpoint') {
        setCheckpoint(nextPosition);
        setLastEvent('Checkpoint reached. This is your recovery space.');
      }
      if ((cell === 'coffee' || cell === 'focus' || cell === 'bell') && !collectedTokens.has(tokenKey)) {
        collectToken(cell, nextPosition);
      }
      if (clocks.some((clockEnemy) => same(clockEnemy.path[clockEnemy.step], nextPosition))) {
        window.setTimeout(handleClockHit, 0);
      }
      playTone(240 + level * 10, 0.035, 'triangle');
      return nextPosition;
    });
  }, [clocks, collectToken, collectedTokens, finishLevel, gameState, handleClockHit, level, levelData.grid, levelData.room.goal, playTone]);

  useEffect(() => {
    const parsed = parseLevel(levelTemplates[level - 1]);
    setPlayer(parsed.start);
    setCheckpoint(parsed.start);
    setClocks(parsed.clocks);
    setTimeLeft(parsed.time);
  }, [level]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1 || anger >= 100) {
          playTone(90, 0.4, 'sawtooth');
          setLastEvent('The barometer filled up. The group started without you.');
          setGameState('game-over');
          return 0;
        }
        if (current <= 6) playTone(120 + current * 12, 0.05, 'square');
        return current - 1;
      });
      setTick((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [anger, gameState, playTone]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = window.setInterval(() => {
      if (activeFocus) return;
      setClocks((currentClocks) => {
        const nextClocks = currentClocks.map((clockEnemy) => moveClock(clockEnemy, player, level, nowTick, levelData.grid));
        if (nextClocks.some((clockEnemy) => same(clockEnemy.path[clockEnemy.step], player))) {
          window.setTimeout(handleClockHit, 0);
        }
        return nextClocks;
      });
    }, activeCoffee ? levelData.clockSpeed + 180 : levelData.clockSpeed);
    return () => window.clearInterval(interval);
  }, [activeCoffee, activeFocus, gameState, handleClockHit, level, levelData.clockSpeed, levelData.grid, nowTick, player]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        W: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        S: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        A: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
        D: { x: 1, y: 0 },
      };
      const direction = keyMap[event.key];
      if (direction) {
        event.preventDefault();
        movePlayer(direction.x, direction.y);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [movePlayer]);

  useEffect(() => {
    if (!audioEnabled || gameState !== 'playing') {
      if (ambientRef.current) window.clearInterval(ambientRef.current);
      ambientRef.current = null;
      return;
    }
    ambientRef.current = window.setInterval(() => playTone(82 + level * 3, 0.06, 'sine'), 1700);
    return () => {
      if (ambientRef.current) window.clearInterval(ambientRef.current);
      ambientRef.current = null;
    };
  }, [audioEnabled, gameState, level, playTone]);

  const restart = () => resetLevel(level);
  const nextLevel = () => resetLevel(Math.min(level + 1, maxLevel));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="theme-game-screen pb-10 max-w-6xl mx-auto">
      <section className="arcade-border-pink glass-panel-pink rounded-xl p-4 md:p-5 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">{game.subtitle}</p>
            <h1 className="text-xl md:text-3xl font-arcade mobile-readable-arcade text-white mt-3">{game.title}</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-2xl">
              A fair clock-chase about route design. Use checkpoints, pickups, and timing to reach the Erasmus+ Activity Room.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAudioEnabled((value) => !value)}
              className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-cyan-400"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 inline mr-2" /> : <VolumeX className="w-4 h-4 inline mr-2" />}
              Sound
            </button>
            <button
              onClick={() => setGameState((state) => state === 'playing' ? 'paused' : state === 'paused' ? 'playing' : state)}
              disabled={gameState !== 'playing' && gameState !== 'paused'}
              className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-green-400 disabled:opacity-40"
            >
              {gameState === 'paused' ? <Play className="w-4 h-4 inline mr-2" /> : <Pause className="w-4 h-4 inline mr-2" />}
              {gameState === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button onClick={restart} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-pink-400">
              <RotateCcw className="w-4 h-4 inline mr-2" /> Restart
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        <div className="arcade-border glass-panel rounded-xl p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Level {level}/10 - {levelTemplates[level - 1].title}</p>
              <h2 className="text-sm font-arcade text-cyan-300">Fair Route Challenge</h2>
            </div>
            <AngerBar anger={anger} timeLeft={timeLeft} clockCount={clocks.length} latePasses={Math.max(0, Math.floor((100 - angerPenalty) / levelData.hitPenalty))} />
          </div>

          <div className="mx-auto w-full max-w-[min(720px,calc(100vw-2rem))]">
            <div
              className="relative grid overflow-hidden rounded-xl border-2 border-cyan-400/60 bg-[#020617] shadow-[0_0_28px_rgba(0,242,255,.18)] touch-none"
              style={{
                gridTemplateColumns: `repeat(${levelData.grid.length}, minmax(0, 1fr))`,
                aspectRatio: '1 / 1',
              }}
            >
              {levelData.grid.map((row, y) =>
                row.map((cell, x) => {
                  const point = { x, y };
                  const tokenKey = `${x},${y}`;
                  return (
                    <Tile
                      key={`${x}-${y}`}
                      cell={cell}
                      isPlayer={same(player, point)}
                      isClock={clocks.some((clockEnemy) => same(clockEnemy.path[clockEnemy.step], point))}
                      isPathHint={safePath.some((safePoint) => same(safePoint, point))}
                      collected={collectedTokens.has(tokenKey)}
                    />
                  );
                }),
              )}
              <ActivityRoomLayer room={levelData.room} tileCount={levelData.grid.length} tick={tick} visible={manhattan(player, levelData.room.goal) < 8 || gameState !== 'playing'} />
            </div>
          </div>

          <DPad onMove={movePlayer} />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {Array.from({ length: maxLevel }).map((_, index) => {
              const levelNumber = index + 1;
              const unlocked = levelNumber <= highestLevel;
              return (
                <button
                  key={levelNumber}
                  onClick={() => unlocked && resetLevel(levelNumber)}
                  disabled={!unlocked}
                  className={`h-9 min-w-9 rounded border text-[10px] font-black ${level === levelNumber ? 'border-green-300 bg-green-300 text-black' : unlocked ? 'border-white/20 bg-black/50 text-gray-200 hover:border-cyan-300' : 'border-white/10 bg-black/20 text-gray-700'}`}
                  aria-label={`Start Castle Rush level ${levelNumber}`}
                >
                  {levelNumber}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="arcade-border-green glass-panel-green rounded-xl p-4">
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Rocco says</p>
            <p className="text-sm text-white font-bold leading-relaxed mt-3">
              The clocks are pressure, not random punishment. Read the route and use your tools.
            </p>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Tools Active</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <ToolStatus active={activeCoffee} icon={<Coffee className="w-4 h-4" />} label="Rhythm" />
              <ToolStatus active={activeFocus} icon={<Focus className="w-4 h-4" />} label="Freeze" />
              <ToolStatus active={activeBell} icon={<Bell className="w-4 h-4" />} label="Path" />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mt-3">{lastEvent}</p>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Design Note</p>
            <p className="text-sm text-gray-300 leading-relaxed mt-3">{designNotes[level - 1]}</p>
          </div>
        </aside>
      </section>

      {gameState === 'intro' && (
        <Overlay title="Rocco Warning" tone="pink">
          <p className="text-lg text-white font-black leading-relaxed">You are late for the activities! Emanuel is waiting with the group.</p>
          <p className="text-sm text-gray-300 leading-relaxed mt-4">
            This version is about fair level design: visible routes, predictable clocks, checkpoints, and tools.
          </p>
          <button onClick={() => resetLevel(1)} className="mt-6 arcade-border px-6 py-3 bg-cyan-900/40 text-cyan-200 text-xs font-bold uppercase tracking-widest hover:bg-cyan-400 hover:text-black">
            Start Running
          </button>
        </Overlay>
      )}

      {gameState === 'paused' && (
        <Overlay title="Paused" tone="pink">
          <p className="text-lg text-white font-black leading-relaxed">Look at the route. Good level design gives players time to plan.</p>
          <p className="text-sm text-gray-300 leading-relaxed mt-4">{designNotes[level - 1]}</p>
          <button onClick={() => setGameState('playing')} className="mt-6 arcade-border px-6 py-3 bg-cyan-900/40 text-cyan-200 text-xs font-bold uppercase tracking-widest hover:bg-cyan-400 hover:text-black">
            Resume
          </button>
        </Overlay>
      )}

      {gameState === 'won-level' && (
        <Overlay title="You Made It!" tone="green">
          <p className="text-lg text-white font-black">You reached the Activity Room.</p>
          <p className="text-sm text-gray-300 mt-4">{designNotes[level - 1]}</p>
          <button onClick={nextLevel} className="mt-6 arcade-border-green px-6 py-3 bg-green-900/40 text-green-200 text-xs font-bold uppercase tracking-widest hover:bg-green-400 hover:text-black">
            Next Level
          </button>
        </Overlay>
      )}

      {gameState === 'game-over' && (
        <Overlay title="Game Over" tone="red">
          <p className="text-lg text-white font-black">The group started without you.</p>
          <p className="text-sm text-gray-300 mt-4">{lastEvent}</p>
          <button onClick={restart} className="mt-6 border-2 border-red-400 px-6 py-3 text-red-200 text-xs font-bold uppercase tracking-widest hover:bg-red-400 hover:text-black">
            Try Again
          </button>
        </Overlay>
      )}

      {gameState === 'completed' && (
        <Overlay title="Training Saved" tone="green">
          <p className="text-lg text-white font-black">You completed all 10 fair route challenges.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-left">
            {[
              'Readable enemies are fair.',
              'Checkpoints make pressure recoverable.',
              'Pickups create meaningful choices.',
              'Good level design teaches through movement.',
            ].map((line) => (
              <div key={line} className="rounded-lg border border-green-400/30 bg-green-400/10 p-3 text-sm text-green-100 font-bold">{line}</div>
            ))}
          </div>
          <button
            onClick={() => updatePrototypeField('gameplayMechanics', game.prototypePrompt)}
            className="mt-6 arcade-border-green px-6 py-3 bg-green-900/40 text-green-200 text-xs font-bold uppercase tracking-widest hover:bg-green-400 hover:text-black"
          >
            Send Takeaway to Prototype Lab
          </button>
        </Overlay>
      )}
    </motion.div>
  );
}

function Tile({ cell, isPlayer, isClock, isPathHint, collected }: { key?: string; cell: Cell; isPlayer: boolean; isClock: boolean; isPathHint: boolean; collected: boolean }) {
  const isWall = cell === 'wall';
  const isRoom = cell === 'room' || cell === 'exit';
  const isDot = cell === 'dot' || cell === 'start';
  return (
    <div className={`relative min-w-0 min-h-0 ${
      isWall
        ? 'bg-cyan-950 border border-cyan-400/40 shadow-[inset_0_0_8px_rgba(0,242,255,.18)]'
        : isRoom
          ? 'bg-emerald-950 border border-emerald-500/40'
          : cell === 'checkpoint'
            ? 'bg-blue-950 border border-blue-300/50'
            : 'bg-slate-950 border border-slate-900'
    }`}>
      {!isWall && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.05),transparent_65%)]" />}
      {isPathHint && <span className="absolute inset-[30%] rounded-full bg-yellow-200/70 shadow-[0_0_12px_rgba(254,240,138,.85)]" />}
      {isDot && <span className="absolute left-1/2 top-1/2 h-[10%] w-[10%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/45" />}
      {cell === 'checkpoint' && <span className="absolute inset-[24%] rounded-md border border-blue-200 bg-blue-300/30 shadow-[0_0_10px_rgba(147,197,253,.55)]" />}
      {!collected && cell === 'coffee' && <Token icon={<Coffee className="h-[68%] w-[68%]" />} className="bg-yellow-300 text-black border-yellow-100" />}
      {!collected && cell === 'focus' && <Token icon={<Focus className="h-[68%] w-[68%]" />} className="bg-green-300 text-black border-green-100" />}
      {!collected && cell === 'bell' && <Token icon={<Bell className="h-[68%] w-[68%]" />} className="bg-pink-300 text-black border-pink-100" />}
      {isClock && <ClockEnemySprite />}
      {isPlayer && <PlayerSprite />}
    </div>
  );
}

function Token({ icon, className }: { icon: ReactNode; className: string }) {
  return (
    <div className={`absolute inset-[18%] z-10 flex items-center justify-center rounded-full border-2 shadow-[0_0_12px_rgba(255,255,255,.5)] ${className}`}>
      {icon}
    </div>
  );
}

function PlayerSprite() {
  return (
    <div className="absolute inset-[15%] z-30 rounded-full border-2 border-white bg-yellow-300 shadow-[0_0_14px_rgba(250,204,21,.9)]">
      <div className="absolute left-[62%] top-[20%] h-[15%] w-[15%] rounded-full bg-black/70" />
      <div className="absolute left-[62%] top-[58%] h-[15%] w-[15%] rounded-full bg-black/70" />
    </div>
  );
}

function ClockEnemySprite() {
  return (
    <div className="absolute inset-[14%] z-20 flex items-center justify-center rounded-full border-2 border-red-200 bg-red-500 text-white shadow-[0_0_14px_rgba(248,113,113,.9)]">
      <Clock className="h-[70%] w-[70%]" strokeWidth={3} />
    </div>
  );
}

function ActivityRoomLayer({ room, tileCount, tick, visible }: { room: ActivityRoom; tileCount: number; tick: number; visible: boolean }) {
  const cell = 100 / tileCount;
  const participants = Array.from({ length: 21 }).map((_, index) => {
    const angle = Math.PI * 0.08 + (Math.PI * 1.84 * index) / 20;
    return {
      x: 50 + Math.cos(angle) * 35,
      y: 53 + Math.sin(angle) * 34,
    };
  });
  const emanuelLeft = tick % 2 === 0 ? 42 : 58;
  return (
    <div
      className={`pointer-events-none absolute z-10 rounded-lg border-2 border-emerald-300/80 bg-emerald-500/10 shadow-[0_0_22px_rgba(16,185,129,.45)] transition-opacity ${visible ? 'opacity-100' : 'opacity-45'}`}
      style={{
        left: `${room.x * cell}%`,
        top: `${room.y * cell}%`,
        width: `${room.width * cell}%`,
        height: `${room.height * cell}%`,
      }}
    >
      <p className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[7px] font-black uppercase text-emerald-100">
        Activity Room
      </p>
      <div className="absolute left-[29%] top-[38%] h-[24%] w-[42%] rounded-full border-2 border-yellow-200/70 bg-yellow-900/20" />
      {participants.map((position, index) => (
        <span
          key={index}
          className="absolute h-[8%] w-[8%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100 bg-white/90 shadow-[0_0_5px_rgba(255,255,255,.35)]"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        />
      ))}
      <div
        className="absolute h-[13%] w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-yellow-300 transition-all duration-500 shadow-[0_0_10px_rgba(253,224,71,.7)]"
        style={{ left: `${emanuelLeft}%`, top: '49%' }}
      />
    </div>
  );
}

function AngerBar({ anger, timeLeft, clockCount, latePasses }: { anger: number; timeLeft: number; clockCount: number; latePasses: number }) {
  const color = anger > 78 ? 'bg-red-500' : anger > 48 ? 'bg-yellow-300' : 'bg-green-400';
  return (
    <div className="w-full md:w-80 bg-black/70 border border-white/10 rounded-xl p-3">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-2">
        <span className="text-gray-400">Emanuel Barometer</span>
        <span className={anger > 78 ? 'text-red-300' : 'text-white'}>{timeLeft}s</span>
      </div>
      <div className="h-4 rounded-full bg-gray-900 overflow-hidden border border-white/10">
        <div className={`h-full ${color} ${anger > 78 ? 'animate-pulse' : ''}`} style={{ width: `${anger}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase">
        <span className="text-red-200 flex items-center gap-1"><Clock className="w-3 h-3" /> {clockCount} clocks</span>
        <span className="text-cyan-200">{latePasses} late passes</span>
        {anger > 78 && <span className="text-red-300 flex items-center gap-1"><Flame className="w-3 h-3" /> high</span>}
      </div>
    </div>
  );
}

function ToolStatus({ active, icon, label }: { active: boolean; icon: ReactNode; label: string }) {
  return (
    <div className={`rounded-lg border p-2 text-center ${active ? 'border-green-300 bg-green-300/15 text-green-100' : 'border-white/10 bg-black/50 text-gray-500'}`}>
      <div className="flex justify-center">{icon}</div>
      <p className="mt-1 text-[9px] font-black uppercase">{label}</p>
    </div>
  );
}

function DPad({ onMove }: { onMove: (dx: number, dy: number) => void }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 w-44 mx-auto xl:hidden">
      <span />
      <PadButton label="Up" onClick={() => onMove(0, -1)} />
      <span />
      <PadButton label="Left" onClick={() => onMove(-1, 0)} />
      <div className="rounded-lg border border-white/10 bg-black/60 flex items-center justify-center">
        <Gamepad2 className="w-5 h-5 text-gray-500" />
      </div>
      <PadButton label="Right" onClick={() => onMove(1, 0)} />
      <span />
      <PadButton label="Down" onClick={() => onMove(0, 1)} />
      <span />
    </div>
  );
}

function PadButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="h-12 rounded-lg border border-cyan-400/50 bg-cyan-400/10 text-[10px] font-bold uppercase text-cyan-100 active:bg-cyan-400 active:text-black">
      {label}
    </button>
  );
}

function Overlay({ title, tone, children }: { title: string; tone: 'pink' | 'green' | 'red'; children: ReactNode }) {
  const toneClass = tone === 'green' ? 'arcade-border-green' : tone === 'red' ? 'border-2 border-red-400 shadow-[0_0_16px_rgba(248,113,113,.45)]' : 'arcade-border-pink';
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${toneClass} bg-black/90 rounded-xl p-6 max-w-xl w-full text-center`}>
        <h2 className="text-xl sm:text-2xl font-arcade mobile-readable-arcade text-white">{title}</h2>
        <div className="mt-5">{children}</div>
      </motion.div>
    </div>
  );
}

function parseLevel(template: LevelTemplate) {
  const size = Math.max(template.rows.length, ...template.rows.map((row) => row.length));
  const grid: Cell[][] = template.rows.map((row) => row.padEnd(size, '#').split('').map(charToCell));
  let start = { x: 1, y: 1 };
  let goal = { x: 1, y: 1 };

  grid.forEach((row, y) => row.forEach((cell, x) => {
    if (cell === 'start') start = { x, y };
    if (cell === 'exit') goal = { x, y };
  }));

  const room = carveActivityRoom(grid, goal);
  const clocks = template.patrols.map((path, id) => ({ id, path, step: 0, direction: 1 as const, alertUntil: 0 }));
  return { grid, start, room, clocks, time: template.time, hitPenalty: template.hitPenalty, clockSpeed: template.clockSpeed };
}

function charToCell(char: string): Cell {
  if (char === '#') return 'wall';
  if (char === 'S') return 'start';
  if (char === 'G') return 'exit';
  if (char === 'R') return 'room';
  if (char === 'C') return 'checkpoint';
  if (char === 'K') return 'coffee';
  if (char === 'F') return 'focus';
  if (char === 'B') return 'bell';
  if (char === '.') return 'dot';
  return 'floor';
}

function carveActivityRoom(grid: Cell[][], goal: Point): ActivityRoom {
  const roomWidth = 5;
  const roomHeight = 5;
  const maxX = Math.max(1, grid[0].length - roomWidth - 1);
  const maxY = Math.max(1, grid.length - roomHeight - 1);
  const x = clampInt(goal.x - 2, 1, maxX);
  const y = clampInt(goal.y - 2, 1, maxY);
  const center = { x: x + Math.floor(roomWidth / 2), y: y + Math.floor(roomHeight / 2) };

  for (let row = y; row < y + roomHeight; row++) {
    for (let column = x; column < x + roomWidth; column++) {
      grid[row][column] = same({ x: column, y: row }, center) ? 'exit' : 'room';
    }
  }

  return {
    x,
    y,
    width: roomWidth,
    height: roomHeight,
    goal: center,
  };
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function moveClock(clockEnemy: ClockEnemy, player: Point, level: number, tick: number, grid: Cell[][]): ClockEnemy {
  const position = clockEnemy.path[clockEnemy.step];
  const canAlert = level >= 3 && manhattan(position, player) <= (level >= 6 ? 5 : 3);
  if (canAlert && tick > clockEnemy.alertUntil) {
    const chaseStep = bestStepToward(position, player, grid);
    if (chaseStep) {
      const existingIndex = clockEnemy.path.findIndex((point) => same(point, chaseStep));
      if (existingIndex >= 0) {
        return { ...clockEnemy, step: existingIndex, alertUntil: tick + (level >= 6 ? 2 : 1) };
      }
    }
  }

  let nextStep = clockEnemy.step + clockEnemy.direction;
  let nextDirection = clockEnemy.direction;
  if (nextStep >= clockEnemy.path.length || nextStep < 0) {
    nextDirection = clockEnemy.direction === 1 ? -1 : 1;
    nextStep = clockEnemy.step + nextDirection;
  }
  return { ...clockEnemy, step: nextStep, direction: nextDirection };
}

function bestStepToward(from: Point, to: Point, grid: Cell[][]) {
  const options = directions
    .map((direction) => ({ x: from.x + direction.x, y: from.y + direction.y }))
    .filter((point) => isWalkable(grid, point) && grid[point.y][point.x] !== 'room' && grid[point.y][point.x] !== 'exit')
    .sort((a, b) => manhattan(a, to) - manhattan(b, to));
  return options[0];
}

function findPath(grid: Cell[][], start: Point, goal: Point) {
  const queue = [start];
  const visited = new Set([keyOf(start)]);
  const previous = new Map<string, Point>();

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (same(current, goal)) break;
    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = keyOf(next);
      if (visited.has(key) || !isWalkable(grid, next)) continue;
      visited.add(key);
      previous.set(key, current);
      queue.push(next);
    }
  }

  const path: Point[] = [];
  let current = goal;
  while (!same(current, start) && previous.has(keyOf(current))) {
    path.unshift(current);
    current = previous.get(keyOf(current))!;
  }
  return path.slice(0, 16);
}

function isWalkable(grid: Cell[][], point: Point) {
  const cell = grid[point.y]?.[point.x];
  return Boolean(cell && cell !== 'wall');
}

function keyOf(point: Point) {
  return `${point.x},${point.y}`;
}

function manhattan(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function same(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

const levelTemplates: LevelTemplate[] = [
  {
    title: 'Readable Patrol',
    time: 62,
    hitPenalty: 12,
    clockSpeed: 760,
    rows: [
      '###############',
      '#S..K....#RRR#',
      '#.#####..#RGR#',
      '#.....#..#RRR#',
      '#####.#..##..#',
      '#.....#......#',
      '#.C.###.####.#',
      '#...#...#....#',
      '#.#.#.###.##.#',
      '#.#...#...#..#',
      '#.#####.#.#B##',
      '#.......#....#',
      '#.##########.#',
      '#F............#'.slice(0, 15),
      '###############',
    ],
    patrols: [
      [{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }],
    ],
  },
  {
    title: 'Safe Zone',
    time: 60,
    hitPenalty: 12,
    clockSpeed: 720,
    rows: [
      '###############',
      '#S....#....RR#',
      '#.###.#.##.RG#',
      '#...#.#....RR#',
      '###.#.####...#',
      '#...#....#.#.#',
      '#.#####K.#.#.#',
      '#.....#..#.#.#',
      '#.C.#.#..#...#',
      '###.#.##.###.#',
      '#...#....#B..#',
      '#.######.#.###',
      '#F.......#...#',
      '#...........##',
      '###############',
    ],
    patrols: [
      [{ x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 7, y: 6 }, { x: 7, y: 5 }],
    ],
  },
  {
    title: 'Risky Shortcut',
    time: 58,
    hitPenalty: 14,
    clockSpeed: 700,
    rows: [
      '###############',
      '#S....K..#RRR#',
      '#.#####..#RGR#',
      '#.#...#..#RRR#',
      '#.#.#.#..##..#',
      '#...#.#......#',
      '###.#.######.#',
      '#...#....C...#',
      '#.######.###.#',
      '#....B...#...#',
      '#.########.#.#',
      '#......F...#.#',
      '######.#####.#',
      '#............#',
      '###############',
    ],
    patrols: [
      [{ x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }],
      [{ x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 }],
    ],
  },
  {
    title: 'Checkpoint Lesson',
    time: 56,
    hitPenalty: 15,
    clockSpeed: 670,
    rows: [
      '###############',
      '#S..#.....#RR#',
      '#.#.#.###.#RG#',
      '#.#...#K..#RR#',
      '#.#####.###..#',
      '#.....#......#',
      '#####.####.#.#',
      '#...#..C...#.#',
      '#.#.#####.##.#',
      '#.#.....#....#',
      '#.#####.####.#',
      '#...B...#F...#',
      '###.#####.##.#',
      '#...........##',
      '###############',
    ],
    patrols: [
      [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }],
      [{ x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 7, y: 10 }],
    ],
  },
  {
    title: 'Pickup Choice',
    time: 54,
    hitPenalty: 16,
    clockSpeed: 640,
    rows: [
      '###############',
      '#S....#K...RR#',
      '####..#.##.RG#',
      '#.....#....RR#',
      '#.#########..#',
      '#.#.....B....#',
      '#.#.#######.##',
      '#.#...C.....##',
      '#.###.#####..#',
      '#...#.....#..#',
      '###.#####.#.##',
      '#...F.....#..#',
      '#.##########.#',
      '#............#',
      '###############',
    ],
    patrols: [
      [{ x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 }],
      [{ x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 }, { x: 10, y: 9 }],
    ],
  },
  {
    title: 'Alert Clock',
    time: 54,
    hitPenalty: 20,
    clockSpeed: 610,
    rows: [
      '###############',
      '#S...K....#RR#',
      '#.######..#RG#',
      '#......#..#RR#',
      '######.#..##.#',
      '#B.....#.....#',
      '#.##########.#',
      '#.....C......#',
      '#.######.###.#',
      '#.#....#...#.#',
      '#.#.##.###.#.#',
      '#...F......#.#',
      '##########.#.#',
      '#............#',
      '###############',
    ],
    patrols: [
      [{ x: 6, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 }],
      [{ x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }],
      [{ x: 9, y: 11 }, { x: 10, y: 11 }, { x: 11, y: 11 }],
    ],
  },
  {
    title: 'Recovery Space',
    time: 52,
    hitPenalty: 20,
    clockSpeed: 580,
    rows: [
      '###############',
      '#S.....#K.#RR#',
      '#.###..#..#RG#',
      '#...#..#..#RR#',
      '###.#.###.##.#',
      '#...#...#....#',
      '#.#####.####.#',
      '#...C...#B...#',
      '###.###.###.##',
      '#...#.....#..#',
      '#.###.###.#..#',
      '#.....#F..#..#',
      '#.##########.#',
      '#............#',
      '###############',
    ],
    patrols: [
      [{ x: 5, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }],
      [{ x: 4, y: 9 }, { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }],
      [{ x: 10, y: 5 }, { x: 11, y: 5 }, { x: 12, y: 5 }],
    ],
  },
  {
    title: 'Timing Window',
    time: 50,
    hitPenalty: 22,
    clockSpeed: 550,
    rows: [
      '###############',
      '#S..K.....#RR#',
      '#.######..#RG#',
      '#.#....#..#RR#',
      '#.#.##.##.##.#',
      '#...#.......B#',
      '###.#######.##',
      '#...C........#',
      '#.####.#######',
      '#.#....#.....#',
      '#.#.####.###.#',
      '#...F....#...#',
      '#.########.#.#',
      '#............#',
      '###############',
    ],
    patrols: [
      [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }],
      [{ x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }],
      [{ x: 8, y: 11 }, { x: 9, y: 11 }, { x: 10, y: 11 }],
    ],
  },
  {
    title: 'Two Routes',
    time: 49,
    hitPenalty: 23,
    clockSpeed: 520,
    rows: [
      '###############',
      '#S...#K...#RR#',
      '#.##.#.##.#RG#',
      '#....#....#RR#',
      '####.........#',
      '#....B......##',
      '#.#########..#',
      '#...C.....#..#',
      '###.#####.#.##',
      '#...#F..#.#..#',
      '#.###.#.#.##.#',
      '#.....#......#',
      '#.##########.#',
      '#............#',
      '###############',
    ],
    patrols: [
      [{ x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 }],
      [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }],
      [{ x: 6, y: 11 }, { x: 7, y: 11 }, { x: 8, y: 11 }, { x: 9, y: 11 }],
      [{ x: 11, y: 7 }, { x: 12, y: 7 }, { x: 12, y: 8 }],
    ],
  },
  {
    title: 'Final Fair Maze',
    time: 48,
    hitPenalty: 24,
    clockSpeed: 500,
    rows: [
      '###############',
      '#S..K....#RRR#',
      '#.#####..#RGR#',
      '#.....#..#RRR#',
      '#####.#.###..#',
      '#B....#......#',
      '#.##########.#',
      '#...C........#',
      '#.#####.####.#',
      '#.#...#....#.#',
      '#.#.#.####.#.#',
      '#...#F.....#.#',
      '#.########.#.#',
      '#............#',
      '###############',
    ],
    patrols: [
      [{ x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 }],
      [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }],
      [{ x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }],
      [{ x: 8, y: 11 }, { x: 9, y: 11 }, { x: 10, y: 11 }],
      [{ x: 12, y: 12 }, { x: 12, y: 11 }, { x: 12, y: 10 }],
    ],
  },
];
