import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Clock, Flame, Gamepad2, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';

type Cell = 'wall' | 'floor' | 'dot' | 'start' | 'exit' | 'room';
type Point = { x: number; y: number };
type ActivityRoom = { x: number; y: number; width: number; height: number; goal: Point; door: Point };
type ClockEnemy = { id: number; position: Point; direction: Point };
type GameState = 'intro' | 'playing' | 'won-level' | 'game-over' | 'completed';

const game = gameCatalog.find((item) => item.id === 'castle-rush')!;
const maxLevel = 10;
const directions = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const designNotes = [
  'Level 1: A clear goal makes the first move easy to understand.',
  'Level 2: A chasing enemy creates pressure without adding many rules.',
  'Level 3: Dots and corridors help players read where they can move.',
  'Level 4: A visible goal room gives the maze a strong destination.',
  'Level 5: Time pressure changes emotion, not only difficulty.',
  'Level 6: Enemy speed can make a familiar rule feel new again.',
  'Level 7: Good difficulty asks for better decisions, not random luck.',
  'Level 8: Collision feedback must be immediate and easy to read.',
  'Level 9: A hard route still needs a fair path to success.',
  'Level 10: A good ending turns tension into a lesson players remember.',
];

export default function CastleRushGame() {
  const { completeGame, saveGameNote, updatePrototypeField } = useStore();
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>('intro');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [tick, setTick] = useState(0);
  const [lastEvent, setLastEvent] = useState('Reach the Activity Room before the clocks catch you.');
  const audioRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<number | null>(null);

  const levelConfig = getLevelConfig(level);
  const maze = useMemo(() => generateClockMaze(level), [level]);
  const [player, setPlayer] = useState<Point>(maze.start);
  const [clocks, setClocks] = useState<ClockEnemy[]>(maze.clockStarts);
  const [timeLeft, setTimeLeft] = useState(levelConfig.time);
  const anger = Math.round(((levelConfig.time - timeLeft) / levelConfig.time) * 100);
  const tileCount = maze.grid.length;

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

  const startLevel = useCallback((nextLevel = level) => {
    const nextMaze = generateClockMaze(nextLevel);
    const nextConfig = getLevelConfig(nextLevel);
    setLevel(nextLevel);
    setPlayer(nextMaze.start);
    setClocks(nextMaze.clockStarts);
    setTimeLeft(nextConfig.time);
    setTick(0);
    setLastEvent(nextLevel >= 6 ? 'Warning: from this level, one clock hit ends the run.' : 'Clock hit means lost time. Keep moving.');
    setGameState('playing');
    saveGameNote(game.id, `Reached level ${nextLevel}/10`);
  }, [level, saveGameNote]);

  const loseToClock = useCallback(() => {
    playTone(80, 0.35, 'sawtooth');
    setLastEvent('A clock caught you. Emanuel started without you.');
    setGameState('game-over');
  }, [playTone]);

  const handleClockHit = useCallback(() => {
    if (level >= 6) {
      loseToClock();
      return;
    }
    playTone(110, 0.16, 'sawtooth');
    setPlayer(maze.start);
    setClocks(maze.clockStarts);
    setTimeLeft((current) => Math.max(1, current - 7));
    setLastEvent('Clock hit. You lost time and got sent back to the entrance.');
  }, [level, loseToClock, maze.clockStarts, maze.start, playTone]);

  const finishLevel = useCallback(() => {
    const finalLevel = level >= maxLevel;
    playTone(finalLevel ? 880 : 660, 0.16, 'sine');
    if (finalLevel) {
      setGameState('completed');
      completeGame(game.id, 1000, game.takeaway, 'Completed all 10 Castle Rush clock-chase levels');
    } else {
      setGameState('won-level');
      saveGameNote(game.id, `Reached level ${level + 1}/10`);
    }
  }, [completeGame, level, playTone, saveGameNote]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;
    setPlayer((current) => {
      const next = { x: current.x + dx, y: current.y + dy };
      const nextCell = maze.grid[next.y]?.[next.x];
      if (!nextCell || nextCell === 'wall') return current;
      playTone(240 + level * 10, 0.035, 'triangle');
      if (clocks.some((clockEnemy) => same(clockEnemy.position, next))) {
        window.setTimeout(handleClockHit, 0);
        return next;
      }
      if (same(next, maze.exit) || nextCell === 'exit') {
        window.setTimeout(finishLevel, 0);
      }
      return next;
    });
  }, [clocks, finishLevel, gameState, handleClockHit, level, maze.exit, maze.grid, playTone]);

  useEffect(() => {
    setPlayer(maze.start);
    setClocks(maze.clockStarts);
    setTimeLeft(levelConfig.time);
  }, [levelConfig.time, maze.clockStarts, maze.start]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          playTone(90, 0.4, 'sawtooth');
          setGameState('game-over');
          setLastEvent('The anger barometer filled up.');
          return 0;
        }
        if (current <= 6) playTone(120 + current * 12, 0.05, 'square');
        return current - 1;
      });
      setTick((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [gameState, playTone]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = window.setInterval(() => {
      setClocks((currentClocks) => {
        const nextClocks = currentClocks.map((clockEnemy) => moveClockEnemy(clockEnemy, maze.grid, player, tick + clockEnemy.id, level));
        if (nextClocks.some((clockEnemy) => same(clockEnemy.position, player))) {
          window.setTimeout(handleClockHit, 0);
        }
        return nextClocks;
      });
    }, Math.max(260, levelConfig.clockSpeed));
    return () => window.clearInterval(interval);
  }, [gameState, handleClockHit, level, levelConfig.clockSpeed, maze.grid, player, tick]);

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

  const restart = () => startLevel(level);
  const nextLevel = () => startLevel(Math.min(level + 1, maxLevel));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-6xl mx-auto">
      <section className="arcade-border-pink glass-panel-pink rounded-xl p-4 md:p-5 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">{game.subtitle}</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">{game.title}</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-2xl">
              A Pac-Man style training sprint inside Residenza Antico Borgo. Reach the Activity Room while clock enemies chase you.
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
              <p className="text-[10px] text-gray-500 font-bold uppercase">Level {level}/10</p>
              <h2 className="text-sm font-arcade text-cyan-300">Clock Chase</h2>
            </div>
            <AngerBar anger={anger} timeLeft={timeLeft} clockCount={clocks.length} />
          </div>

          <div className="mx-auto w-full max-w-[720px]">
            <div
              className="relative grid overflow-hidden rounded-xl border-2 border-cyan-400/60 bg-[#020617] shadow-[0_0_28px_rgba(0,242,255,.18)]"
              style={{
                gridTemplateColumns: `repeat(${tileCount}, minmax(0, 1fr))`,
                aspectRatio: '1 / 1',
              }}
            >
              {maze.grid.map((row, y) =>
                row.map((cell, x) => (
                  <Tile
                    key={`${x}-${y}`}
                    cell={cell}
                    isPlayer={player.x === x && player.y === y}
                    isExit={maze.exit.x === x && maze.exit.y === y}
                    hasClock={clocks.some((clockEnemy) => same(clockEnemy.position, { x, y }))}
                  />
                )),
              )}
              <ActivityRoomLayer room={maze.room} tileCount={tileCount} tick={tick} />
            </div>
          </div>

          <DPad onMove={movePlayer} />
        </div>

        <aside className="space-y-4">
          <div className="arcade-border-green glass-panel-green rounded-xl p-4">
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Rocco says</p>
            <p className="text-sm text-white font-bold leading-relaxed mt-3">
              You are late for the activities! Emanuel, the Trainer is getting angry!
            </p>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Current Feedback</p>
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
          <p className="text-lg text-white font-black leading-relaxed">You are late for the activities! Emanuel, the Trainer is getting angry!</p>
          <p className="text-sm text-gray-300 leading-relaxed mt-4">
            Avoid the clocks, read the maze, and enter the Activity Room before the barometer fills.
          </p>
          <button onClick={() => startLevel(1)} className="mt-6 arcade-border px-6 py-3 bg-cyan-900/40 text-cyan-200 text-xs font-bold uppercase tracking-widest hover:bg-cyan-400 hover:text-black">
            Start Running
          </button>
        </Overlay>
      )}

      {gameState === 'won-level' && (
        <Overlay title="You Made It!" tone="green">
          <p className="text-lg text-white font-black">You made it! The activity can start.</p>
          <p className="text-sm text-gray-300 mt-4">{designNotes[level - 1]}</p>
          <button onClick={nextLevel} className="mt-6 arcade-border-green px-6 py-3 bg-green-900/40 text-green-200 text-xs font-bold uppercase tracking-widest hover:bg-green-400 hover:text-black">
            Next Level
          </button>
        </Overlay>
      )}

      {gameState === 'game-over' && (
        <Overlay title="Game Over" tone="red">
          <p className="text-lg text-white font-black">Game Over - Emanuel started the session without you.</p>
          <p className="text-sm text-gray-300 mt-4">{lastEvent}</p>
          <button onClick={restart} className="mt-6 border-2 border-red-400 px-6 py-3 text-red-200 text-xs font-bold uppercase tracking-widest hover:bg-red-400 hover:text-black">
            Try Again
          </button>
        </Overlay>
      )}

      {gameState === 'completed' && (
        <Overlay title="Training Saved" tone="green">
          <p className="text-lg text-white font-black">You made it! All 21 participants are ready and Emanuel can finally start.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-left">
            {[
              'The goal was clear.',
              'The clock enemies created readable pressure.',
              'The maze created challenge through space.',
              'The ending gave emotional feedback.',
            ].map((line) => (
              <div key={line} className="rounded-lg border border-green-400/30 bg-green-400/10 p-3 text-sm text-green-100 font-bold">{line}</div>
            ))}
          </div>
          <button
            onClick={() => updatePrototypeField('coreMechanic', game.prototypePrompt)}
            className="mt-6 arcade-border-green px-6 py-3 bg-green-900/40 text-green-200 text-xs font-bold uppercase tracking-widest hover:bg-green-400 hover:text-black"
          >
            Send Takeaway to Prototype Lab
          </button>
        </Overlay>
      )}
    </motion.div>
  );
}

function Tile({ cell, isPlayer, isExit, hasClock }: { key?: string; cell: Cell; isPlayer: boolean; isExit: boolean; hasClock: boolean }) {
  const isWall = cell === 'wall';
  const isRoom = cell === 'room' || cell === 'exit';
  const isDot = cell === 'dot' || cell === 'start';
  return (
    <div className={`relative min-w-0 min-h-0 ${
      isWall
        ? 'bg-cyan-950 border border-cyan-400/40 shadow-[inset_0_0_8px_rgba(0,242,255,.18)]'
        : isRoom
          ? 'bg-emerald-950 border border-emerald-500/40'
          : 'bg-slate-950 border border-slate-900'
    }`}>
      {!isWall && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.05),transparent_65%)]" />}
      {isDot && <span className="absolute left-1/2 top-1/2 h-[12%] w-[12%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/55 shadow-[0_0_7px_rgba(165,243,252,.7)]" />}
      {isExit && <div className="absolute inset-[10%] rounded-md border-2 border-green-300 bg-green-400/15 shadow-[0_0_18px_rgba(57,255,20,.75)] z-10" />}
      {hasClock && <ClockEnemySprite />}
      {isPlayer && <PlayerSprite />}
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

function ActivityRoomLayer({ room, tileCount, tick }: { room: ActivityRoom; tileCount: number; tick: number }) {
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
      className="pointer-events-none absolute z-10 rounded-lg border-2 border-emerald-300/80 bg-emerald-500/10 shadow-[0_0_22px_rgba(16,185,129,.45)]"
      style={{
        left: `${room.x * cell}%`,
        top: `${room.y * cell}%`,
        width: `${room.width * cell}%`,
        height: `${room.height * cell}%`,
      }}
    >
      <div className="absolute -left-[2%] top-[42%] h-[16%] w-[10%] rounded-r-md border-y-2 border-r-2 border-emerald-300 bg-[#020617]" />
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

function AngerBar({ anger, timeLeft, clockCount }: { anger: number; timeLeft: number; clockCount: number }) {
  const color = anger > 78 ? 'bg-red-500' : anger > 48 ? 'bg-yellow-300' : 'bg-green-400';
  return (
    <div className="w-full md:w-80 bg-black/70 border border-white/10 rounded-xl p-3">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-2">
        <span className="text-gray-400">Emanuel Anger</span>
        <span className={anger > 78 ? 'text-red-300' : 'text-white'}>{timeLeft}s</span>
      </div>
      <div className="h-4 rounded-full bg-gray-900 overflow-hidden border border-white/10">
        <div className={`h-full ${color} ${anger > 78 ? 'animate-pulse' : ''}`} style={{ width: `${anger}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase">
        <span className="text-red-200 flex items-center gap-1"><Clock className="w-3 h-3" /> {clockCount} clocks chasing</span>
        {anger > 78 && <span className="text-red-300 flex items-center gap-1"><Flame className="w-3 h-3" /> on fire</span>}
      </div>
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
        <h2 className="text-2xl font-arcade text-white">{title}</h2>
        <div className="mt-5">{children}</div>
      </motion.div>
    </div>
  );
}

function getLevelConfig(level: number) {
  const size = level <= 2 ? 11 : level <= 5 ? 13 : level <= 8 ? 15 : 17;
  const time = Math.max(28, 67 - level * 4);
  const clockCount = Math.min(5, 1 + Math.floor((level + 1) / 3));
  const clockSpeed = 760 - level * 48;
  return { size, time, clockCount, clockSpeed };
}

function generateClockMaze(level: number) {
  const { size, clockCount } = getLevelConfig(level);
  const random = seededRandom(level * 92821 + 17);
  const grid: Cell[][] = Array.from({ length: size }, () => Array<Cell>(size).fill('wall'));
  const start = { x: 1, y: Math.floor(size / 2) % 2 === 1 ? Math.floor(size / 2) : Math.floor(size / 2) - 1 };
  const stack: Point[] = [start];
  grid[start.y][start.x] = 'floor';

  while (stack.length) {
    const current = stack[stack.length - 1];
    const neighbors = shuffle([
      { x: current.x + 2, y: current.y },
      { x: current.x - 2, y: current.y },
      { x: current.x, y: current.y + 2 },
      { x: current.x, y: current.y - 2 },
    ], random).filter((point) => point.x > 0 && point.y > 0 && point.x < size - 1 && point.y < size - 1 && grid[point.y][point.x] === 'wall');

    if (!neighbors.length) {
      stack.pop();
      continue;
    }

    const next = neighbors[0];
    grid[(current.y + next.y) / 2][(current.x + next.x) / 2] = 'floor';
    grid[next.y][next.x] = 'floor';
    stack.push(next);
  }

  const roomAnchor = farthestFloor(grid, start);
  const room = carveActivityRoom(grid, roomAnchor);
  const exit = room.goal;
  grid[start.y][start.x] = 'start';
  grid[exit.y][exit.x] = 'exit';

  grid.forEach((row, y) => row.forEach((cell, x) => {
    if (cell === 'floor' && !same({ x, y }, start)) grid[y][x] = 'dot';
  }));

  const candidates = collectWalkable(grid)
    .filter((point) => !same(point, start) && !isInsideRoom(point, room))
    .sort((a, b) => manhattan(b, start) - manhattan(a, start));

  const clockStarts = shuffle(candidates.slice(0, Math.max(clockCount * 4, 8)), random)
    .slice(0, clockCount)
    .map((position, id) => ({ id, position, direction: directions[id % directions.length] }));

  return { grid, start, exit, room, clockStarts };
}

function carveActivityRoom(grid: Cell[][], anchor: Point): ActivityRoom {
  const size = grid.length;
  const roomWidth = size <= 11 ? 4 : size <= 15 ? 5 : 6;
  const roomHeight = size <= 11 ? 4 : 5;
  const x = clampInt(anchor.x - Math.floor(roomWidth / 2), Math.max(2, size - roomWidth - 2), size - roomWidth - 1);
  const y = clampInt(anchor.y - Math.floor(roomHeight / 2), 1, size - roomHeight - 1);
  const goal = {
    x: x + Math.floor(roomWidth / 2),
    y: y + Math.floor(roomHeight / 2),
  };
  const door = { x: x - 1, y: y + Math.floor(roomHeight / 2) };

  carveConnection(grid, anchor, door);

  for (let roomY = y; roomY < y + roomHeight; roomY++) {
    for (let roomX = x; roomX < x + roomWidth; roomX++) {
      grid[roomY][roomX] = 'room';
    }
  }
  grid[door.y][door.x] = 'room';
  grid[anchor.y][anchor.x] = 'room';

  return { x, y, width: roomWidth, height: roomHeight, goal, door };
}

function carveConnection(grid: Cell[][], from: Point, to: Point) {
  const stepX = from.x <= to.x ? 1 : -1;
  for (let x = from.x; x !== to.x + stepX; x += stepX) {
    if (grid[from.y]?.[x]) grid[from.y][x] = 'floor';
  }
  const stepY = from.y <= to.y ? 1 : -1;
  for (let y = from.y; y !== to.y + stepY; y += stepY) {
    if (grid[y]?.[to.x]) grid[y][to.x] = 'floor';
  }
}

function moveClockEnemy(clockEnemy: ClockEnemy, grid: Cell[][], player: Point, tick: number, level: number): ClockEnemy {
  const options = directions
    .map((direction) => ({
      direction,
      position: { x: clockEnemy.position.x + direction.x, y: clockEnemy.position.y + direction.y },
    }))
    .filter((option) => isWalkable(grid, option.position));

  if (!options.length) return clockEnemy;

  const shouldChase = manhattan(clockEnemy.position, player) <= 5 + Math.floor(level / 2);
  const choice = shouldChase
    ? options.sort((a, b) => manhattan(a.position, player) - manhattan(b.position, player))[0]
    : options.find((option) => same(option.direction, clockEnemy.direction)) ?? options[tick % options.length];

  return { ...clockEnemy, ...choice };
}

function farthestFloor(grid: Cell[][], start: Point) {
  const queue = [{ ...start, distance: 0 }];
  const visited = new Set([`${start.x},${start.y}`]);
  let farthest = start;

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    farthest = current;
    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = `${next.x},${next.y}`;
      if (visited.has(key) || !isWalkable(grid, next)) continue;
      visited.add(key);
      queue.push({ ...next, distance: current.distance + 1 });
    }
  }
  return farthest;
}

function collectWalkable(grid: Cell[][]) {
  const points: Point[] = [];
  grid.forEach((row, y) => row.forEach((cell, x) => {
    if (cell !== 'wall') points.push({ x, y });
  }));
  return points;
}

function isWalkable(grid: Cell[][], point: Point) {
  const cell = grid[point.y]?.[point.x];
  return Boolean(cell && cell !== 'wall');
}

function isInsideRoom(point: Point, room: ActivityRoom) {
  return point.x >= room.x && point.x < room.x + room.width && point.y >= room.y && point.y < room.y + room.height;
}

function manhattan(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function shuffle<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function same(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
