import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Flame, Gamepad2, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';

type Cell = 'wall' | 'floor' | 'start' | 'exit' | 'wrong' | 'torch' | 'rug' | 'room';
type Point = { x: number; y: number };
type ActivityRoom = { x: number; y: number; width: number; height: number; goal: Point };
type GameState = 'intro' | 'playing' | 'won-level' | 'game-over' | 'completed';

const game = gameCatalog.find((item) => item.id === 'castle-rush')!;
const maxLevel = 10;
const designNotes = [
  'Level 1: A clear goal helps players understand what to do immediately.',
  'Level 2: A small maze teaches movement before adding pressure.',
  'Level 3: Dead ends create exploration, but too many can create frustration.',
  'Level 4: Visual landmarks help players read a map quickly.',
  'Level 5: Time pressure creates emotion without adding complex rules.',
  'Level 6: Progressive difficulty keeps the challenge alive.',
  'Level 7: Wrong rooms can create curiosity without blocking the player.',
  'Level 8: Feedback must be visible when tension increases.',
  'Level 9: A strong final path makes the player feel close to success.',
  'Level 10: A good ending connects effort, emotion, and learning.',
];

export default function CastleRushGame() {
  const { completeGame, saveGameNote, updatePrototypeField } = useStore();
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>('intro');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [tick, setTick] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<number | null>(null);

  const levelConfig = getLevelConfig(level);
  const maze = useMemo(() => generateCastleMaze(level), [level]);
  const [player, setPlayer] = useState<Point>(maze.start);
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
    const nextMaze = generateCastleMaze(nextLevel);
    const nextConfig = getLevelConfig(nextLevel);
    setLevel(nextLevel);
    setPlayer(nextMaze.start);
    setTimeLeft(nextConfig.time);
    setGameState('playing');
    saveGameNote(game.id, `Reached level ${nextLevel}/10`);
  }, [level, saveGameNote]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;
    setPlayer((current) => {
      const next = { x: current.x + dx, y: current.y + dy };
      const nextCell = maze.grid[next.y]?.[next.x];
      if (!nextCell || nextCell === 'wall') return current;
      playTone(220 + level * 12, 0.04, 'triangle');
      if (nextCell === 'exit') {
        const finalLevel = level >= maxLevel;
        playTone(finalLevel ? 880 : 660, 0.16, 'sine');
        if (finalLevel) {
          setGameState('completed');
          completeGame(game.id, 1000, game.takeaway, 'Completed all 10 Castle Rush levels');
        } else {
          setGameState('won-level');
          saveGameNote(game.id, `Reached level ${level + 1}/10`);
        }
      }
      return next;
    });
  }, [completeGame, gameState, level, maze.grid, playTone, saveGameNote]);

  useEffect(() => {
    setPlayer(maze.start);
    setTimeLeft(levelConfig.time);
  }, [levelConfig.time, maze.start]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          playTone(90, 0.4, 'sawtooth');
          setGameState('game-over');
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
    ambientRef.current = window.setInterval(() => playTone(80 + level * 3, 0.08, 'sine'), 1800);
    return () => {
      if (ambientRef.current) window.clearInterval(ambientRef.current);
      ambientRef.current = null;
    };
  }, [audioEnabled, gameState, level, playTone]);

  const restart = () => startLevel(level);
  const nextLevel = () => startLevel(Math.min(level + 1, maxLevel));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-5xl mx-auto">
      <section className="arcade-border-pink glass-panel-pink rounded-xl p-4 md:p-5 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">{game.subtitle}</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">{game.title}</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-2xl">
              Residenza Antico Borgo di Filadelfia became a castle maze. Find the Activity Room before Emanuel loses patience.
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

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        <div className="arcade-border glass-panel rounded-xl p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Level {level}/10</p>
              <h2 className="text-sm font-arcade text-cyan-300">Castle Maze</h2>
            </div>
            <AngerBar anger={anger} timeLeft={timeLeft} />
          </div>

          <div className="mx-auto w-full max-w-[720px]">
            <div
              className="relative grid rounded-xl overflow-hidden border-4 border-stone-600 bg-stone-950 shadow-[0_0_24px_rgba(0,242,255,.18)]"
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
                    tick={tick}
                  />
                )),
              )}
              <ActivityRoomOverlay room={maze.room} tileCount={tileCount} tick={tick} />
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
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Controls</p>
            <p className="text-sm text-gray-300 leading-relaxed mt-3">Desktop: arrows or WASD. Mobile: use the D-pad below the maze.</p>
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
          <p className="text-sm text-gray-300 mt-4">Readable feedback matters: the barometer told you the danger was growing.</p>
          <button onClick={restart} className="mt-6 border-2 border-red-400 px-6 py-3 text-red-200 text-xs font-bold uppercase tracking-widest hover:bg-red-400 hover:text-black">
            Try Again
          </button>
        </Overlay>
      )}

      {gameState === 'completed' && (
        <Overlay title="Training Saved" tone="green">
          <p className="text-lg text-white font-black">You made it! All 21 participants are ready and Emanuel can finally start.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-left">
            {['The goal was clear.', 'The time pressure created tension.', 'The maze created challenge.', 'The ending gave emotional feedback.'].map((line) => (
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

function Tile({ cell, isPlayer, isExit, tick }: { key?: string; cell: Cell; isPlayer: boolean; isExit: boolean; tick: number }) {
  const isWall = cell === 'wall';
  const isRoom = cell === 'room' || cell === 'exit';
  return (
    <div className={`relative min-w-0 min-h-0 ${
      isWall
        ? 'bg-stone-600 border border-stone-500'
        : isRoom
          ? 'bg-green-950 border border-green-700/70'
          : 'bg-stone-900 border border-stone-800'
    }`}>
      {!isWall && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.07),transparent_65%)]" />}
      {isRoom && <div className="absolute inset-0 bg-green-400/10" />}
      {cell === 'rug' && <div className="absolute inset-x-[15%] inset-y-[32%] rounded bg-red-700/70 border border-yellow-400/50" />}
      {cell === 'wrong' && <div className="absolute inset-[18%] rounded border-2 border-purple-400/70 bg-purple-500/15" />}
      {cell === 'torch' && <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300 shadow-[0_0_10px_#fb923c]" />}
      {isExit && <div className="absolute inset-0 bg-green-400/20 border-2 border-green-400 shadow-[0_0_18px_rgba(57,255,20,.55)] z-10" />}
      {isPlayer && <div className="absolute inset-[18%] rounded-full bg-cyan-300 border-2 border-white shadow-[0_0_12px_rgba(0,242,255,.95)] z-20" />}
    </div>
  );
}

function ActivityRoomOverlay({ room, tileCount, tick }: { room: ActivityRoom; tileCount: number; tick: number }) {
  const cell = 100 / tileCount;
  const left = room.x * cell;
  const top = room.y * cell;
  const width = room.width * cell;
  const height = room.height * cell;
  const emanuelLeft = tick % 2 === 0 ? 38 : 58;
  const participants = Array.from({ length: 21 }).map((_, index) => {
    const angle = Math.PI * 0.12 + (Math.PI * 1.76 * index) / 20;
    return {
      x: 50 + Math.cos(angle) * 36,
      y: 52 + Math.sin(angle) * 34,
    };
  });
  return (
    <div
      className="absolute bg-green-400/10 border-2 border-green-400 shadow-[0_0_22px_rgba(57,255,20,.55)] z-10 pointer-events-none rounded"
      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
    >
      <p className="absolute left-1 top-1 text-[7px] font-black uppercase text-green-100 bg-black/60 px-1 rounded">Activity Room</p>
      <div className="absolute left-[30%] right-[30%] top-[37%] h-[22%] rounded-full border-2 border-yellow-200/60 bg-yellow-900/30" />
      {participants.map((position, index) => (
        <span
          key={index}
          className="absolute h-[8%] w-[8%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 border border-cyan-200 shadow-[0_0_5px_rgba(255,255,255,.35)]"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        />
      ))}
      <div
        className="absolute h-[13%] w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300 border-2 border-black transition-all duration-500 shadow-[0_0_10px_rgba(253,224,71,.6)]"
        style={{ left: `${emanuelLeft}%`, top: '48%' }}
      />
      <div
        className="absolute h-[10%] w-[10%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-green-300 bg-green-300/40 animate-pulse"
        style={{ left: `${((room.goal.x - room.x) / room.width) * 100 + 50 / room.width}%`, top: `${((room.goal.y - room.y) / room.height) * 100 + 50 / room.height}%` }}
      >
        <span className="sr-only">Goal</span>
      </div>
    </div>
  );
}

function AngerBar({ anger, timeLeft }: { anger: number; timeLeft: number }) {
  const color = anger > 78 ? 'bg-red-500' : anger > 48 ? 'bg-yellow-300' : 'bg-green-400';
  return (
    <div className="w-full sm:w-72 bg-black/70 border border-white/10 rounded-xl p-3">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-2">
        <span className="text-gray-400">Emanuel Anger</span>
        <span className={anger > 78 ? 'text-red-300' : 'text-white'}>{timeLeft}s</span>
      </div>
      <div className="h-4 rounded-full bg-gray-900 overflow-hidden border border-white/10">
        <div className={`h-full ${color} ${anger > 78 ? 'animate-pulse' : ''}`} style={{ width: `${anger}%` }} />
      </div>
      {anger > 78 && <p className="mt-2 text-[10px] text-red-300 font-black uppercase flex items-center gap-1"><Flame className="w-3 h-3" /> Barometer on fire</p>}
    </div>
  );
}

function DPad({ onMove }: { onMove: (dx: number, dy: number) => void }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 w-44 mx-auto lg:hidden">
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
  const size = level <= 2 ? 9 : level <= 5 ? 11 : level <= 8 ? 13 : 15;
  const time = Math.max(24, 58 - level * 3);
  return { size, time };
}

function generateCastleMaze(level: number) {
  const { size } = getLevelConfig(level);
  const random = seededRandom(level * 92821 + 17);
  const grid: Cell[][] = Array.from({ length: size }, () => Array<Cell>(size).fill('wall'));
  const stack: Point[] = [{ x: 1, y: 1 }];
  grid[1][1] = 'floor';

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

  const start = { x: 1, y: 1 };
  const room = carveActivityRoom(grid, farthestFloor(grid, start), level);
  const exit = room.goal;
  grid[start.y][start.x] = 'start';
  grid[exit.y][exit.x] = 'exit';

  decorate(grid, random, start, exit, level);
  return { grid, start, exit, room };
}

function carveActivityRoom(grid: Cell[][], anchor: Point, level: number): ActivityRoom {
  const size = grid.length;
  const roomWidth = size <= 9 ? 3 : size <= 11 ? 4 : 5;
  const roomHeight = size <= 9 ? 3 : 4;
  const x = clampInt(anchor.x - Math.floor(roomWidth / 2), 1, size - roomWidth - 1);
  const y = clampInt(anchor.y - Math.floor(roomHeight / 2), 1, size - roomHeight - 1);
  const goal = {
    x: x + Math.floor(roomWidth / 2),
    y: y + Math.floor(roomHeight / 2),
  };

  for (let roomY = y; roomY < y + roomHeight; roomY++) {
    for (let roomX = x; roomX < x + roomWidth; roomX++) {
      grid[roomY][roomX] = 'room';
    }
  }

  grid[anchor.y][anchor.x] = 'room';
  return { x, y, width: roomWidth, height: roomHeight, goal };
}

function decorate(grid: Cell[][], random: () => number, start: Point, exit: Point, level: number) {
  const floors: Point[] = [];
  grid.forEach((row, y) => row.forEach((cell, x) => {
    if (cell === 'floor') floors.push({ x, y });
  }));

  shuffle(floors, random).slice(0, Math.min(floors.length, 4 + level)).forEach((point, index) => {
    if (same(point, start) || same(point, exit)) return;
    grid[point.y][point.x] = index % 3 === 0 ? 'torch' : index % 3 === 1 ? 'rug' : 'wrong';
  });
}

function farthestFloor(grid: Cell[][], start: Point) {
  const queue = [{ ...start, distance: 0 }];
  const visited = new Set([`${start.x},${start.y}`]);
  let farthest = start;

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    farthest = current;
    for (const direction of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = `${next.x},${next.y}`;
      if (visited.has(key) || grid[next.y]?.[next.x] === 'wall' || !grid[next.y]?.[next.x]) continue;
      visited.add(key);
      queue.push({ ...next, distance: current.distance + 1 });
    }
  }
  return farthest;
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
