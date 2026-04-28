import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Flame, Gamepad2, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';

type Cell = 'wall' | 'floor' | 'start' | 'exit' | 'wrong' | 'torch' | 'rug';
type Point = { x: number; y: number };
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-7xl mx-auto">
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

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4">
        <div className="arcade-border glass-panel rounded-xl p-2 md:p-3 bg-black/80">
          <div className="relative mx-auto w-full max-w-[1120px] overflow-hidden rounded-xl border-[6px] border-stone-950 bg-stone-950 shadow-[0_0_28px_rgba(0,242,255,.2)]">
            <div className="relative aspect-[16/9] min-h-[520px] overflow-hidden bg-[#191816]">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.42)_1px,transparent_1px),linear-gradient(rgba(0,0,0,.42)_1px,transparent_1px)] bg-[size:34px_24px] opacity-45" />
              <div className="absolute inset-x-0 top-0 z-30 h-10 border-b-4 border-black bg-stone-800/95">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] bg-[size:44px_100%]" />
                <div className="relative flex h-full items-center justify-between px-3 md:px-5 text-white [text-shadow:2px_2px_0_#000]">
                  <span className="hidden sm:block text-[10px] md:text-sm font-arcade">TRAINER ANGER</span>
                  <h2 className="text-[11px] sm:text-base md:text-xl font-arcade tracking-wide">Residenza Antico Borgo in Filadelfia</h2>
                  <span className="text-[10px] md:text-sm font-arcade">LEVEL: {level}/10</span>
                </div>
              </div>

              <VerticalAngerBar anger={anger} timeLeft={timeLeft} />
              <RoccoSpeech />

              <div className="absolute left-[3%] right-[3%] top-[14%] bottom-[5%] md:left-[8%] md:right-[20%] flex items-center justify-center">
                <div
                  className="relative grid aspect-square max-h-full max-w-full overflow-hidden border-4 border-black bg-[#8b8774] shadow-[inset_0_0_0_4px_rgba(255,255,255,.18),6px_6px_0_rgba(0,0,0,.45)]"
                  style={{
                    width: 'min(100%, 70vh, 720px)',
                    gridTemplateColumns: `repeat(${tileCount}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${tileCount}, minmax(0, 1fr))`,
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
                  <ActivityRoomOverlay exit={maze.exit} tileCount={tileCount} tick={tick} />
                </div>
              </div>

              <div className="absolute bottom-3 right-3 z-40 hidden sm:flex gap-2">
                <div className="grid h-14 w-14 place-items-center border-4 border-black bg-stone-300 text-stone-900 shadow-[4px_4px_0_#000]">
                  <Gamepad2 className="w-7 h-7" />
                </div>
                <div className="grid h-14 w-14 place-items-center border-4 border-black bg-green-400 text-black shadow-[4px_4px_0_#000]">
                  <span className="text-3xl font-black">✓</span>
                </div>
              </div>
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
  return (
    <div className={`relative min-w-0 min-h-0 ${isWall ? 'bg-[#5f5a4d]' : 'bg-[#8b8774]'}`}>
      {isWall ? (
        <>
          <div className="absolute inset-0 border border-black/70 shadow-[inset_0_2px_0_rgba(255,255,255,.28),inset_0_-3px_0_rgba(0,0,0,.35)]" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-black/45" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/35" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 border border-black/25" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,255,255,.14),transparent_22%),radial-gradient(circle_at_72%_68%,rgba(0,0,0,.18),transparent_20%)]" />
          <div className="absolute left-[12%] top-[18%] h-[12%] w-[28%] bg-black/20" />
          <div className="absolute right-[10%] bottom-[16%] h-[10%] w-[22%] bg-white/10" />
        </>
      )}
      {cell === 'start' && <div className="absolute left-[8%] top-[8%] z-20 border-2 border-black bg-white px-1 text-[7px] font-black uppercase text-black">Start</div>}
      {cell === 'rug' && <div className="absolute inset-x-[10%] inset-y-[34%] bg-red-800/75 border-2 border-yellow-600/70" />}
      {cell === 'wrong' && <div className="absolute inset-[18%] border-2 border-purple-900 bg-purple-500/20 shadow-[inset_0_0_0_2px_rgba(255,255,255,.12)]" />}
      {cell === 'torch' && <Torch tick={tick} />}
      {isExit && <div className="absolute inset-0 bg-green-400/10 border-2 border-green-300 shadow-[0_0_18px_rgba(57,255,20,.55)] z-10" />}
      {isPlayer && <PlayerSprite />}
    </div>
  );
}

function ActivityRoomOverlay({ exit, tileCount, tick }: { exit: Point; tileCount: number; tick: number }) {
  const emanuelOffset = tick % 2 === 0 ? 'left-[16%]' : 'left-[72%]';
  const cell = 100 / tileCount;
  const width = cell * 4;
  const height = cell * 3.4;
  const left = Math.max(0, Math.min(100 - width, (exit.x - 2) * cell));
  const top = Math.max(0, Math.min(100 - height, (exit.y - 1.2) * cell));
  return (
    <div
      className="absolute z-10 pointer-events-none border-4 border-[#3b2119] bg-[#8f5944] shadow-[inset_0_0_0_4px_rgba(255,221,160,.18),0_0_22px_rgba(57,255,20,.4)]"
      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
    >
      <div className="absolute inset-[10%] rounded-sm border-4 border-[#2d1a13] bg-[#a9744d]" />
      <div className="absolute left-[18%] right-[18%] top-[34%] h-[24%] border-2 border-black bg-[#b77743]" />
      <div className="absolute left-[14%] right-[14%] top-[16%] grid grid-cols-7 gap-[3px]">
        {Array.from({ length: 14 }).map((_, index) => (
          <ParticipantDot key={index} index={index} />
        ))}
      </div>
      <div className="absolute left-[14%] right-[14%] bottom-[18%] grid grid-cols-7 gap-[3px]">
        {Array.from({ length: 7 }).map((_, index) => (
          <ParticipantDot key={index + 14} index={index + 14} />
        ))}
      </div>
      <div className={`absolute ${emanuelOffset} top-[14%] h-[18%] w-[12%] transition-all duration-500`}>
        <div className="absolute left-1/2 top-0 h-[45%] w-[42%] -translate-x-1/2 rounded-full border-2 border-black bg-[#f4c08a]" />
        <div className="absolute bottom-0 left-[20%] right-[20%] h-[58%] border-2 border-black bg-red-700" />
      </div>
      <p className="absolute bottom-[3%] left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] sm:text-[10px] md:text-xs font-arcade uppercase text-white [text-shadow:2px_2px_0_#000]">Activity Room</p>
    </div>
  );
}

function VerticalAngerBar({ anger, timeLeft }: { anger: number; timeLeft: number }) {
  const color = anger > 78 ? 'bg-red-500' : anger > 48 ? 'bg-yellow-300' : 'bg-green-400';
  return (
    <div className="absolute left-2 top-12 z-40 hidden sm:flex w-20 flex-col items-center text-center text-white [text-shadow:2px_2px_0_#000]">
      <p className="text-[9px] md:text-[11px] font-arcade uppercase leading-tight">Trainer<br />Anger<br />Barometer</p>
      <div className="relative mt-3 h-36 w-9 border-4 border-black bg-stone-300 p-1 shadow-[3px_3px_0_#000]">
        <div className="relative h-full w-full overflow-hidden border-2 border-stone-700 bg-gray-900">
          <div className={`absolute bottom-0 left-0 right-0 ${color} ${anger > 78 ? 'animate-pulse' : ''}`} style={{ height: `${anger}%` }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,.25)_48%,transparent_52%)] bg-[size:100%_18px]" />
        </div>
        {anger > 64 && (
          <div className="absolute -right-6 -top-4 text-3xl animate-pulse drop-shadow-[2px_2px_0_#000]">🔥</div>
        )}
      </div>
      <p className="mt-2 text-[9px] md:text-[11px] font-arcade uppercase leading-tight">Anger<br />{timeLeft}s</p>
      {anger > 78 && <p className="mt-1 text-[8px] font-black uppercase text-red-200 flex items-center gap-1"><Flame className="w-3 h-3" /> Fire</p>}
    </div>
  );
}

function RoccoSpeech() {
  return (
    <div className="absolute left-[16%] top-12 z-40 hidden md:flex items-start gap-3">
      <div className="relative h-20 w-20">
        <div className="absolute left-1/2 top-0 h-12 w-12 -translate-x-1/2 rounded-full border-4 border-black bg-[#f1bd87] shadow-[3px_3px_0_#000]">
          <div className="absolute left-2 top-5 h-1.5 w-1.5 rounded-full bg-black" />
          <div className="absolute right-2 top-5 h-1.5 w-1.5 rounded-full bg-black" />
          <div className="absolute left-2 right-2 top-1 h-4 rounded-t-full bg-[#6b341d]" />
          <div className="absolute bottom-2 left-1/2 h-1 w-5 -translate-x-1/2 bg-black/70" />
        </div>
        <div className="absolute bottom-0 left-1/2 h-11 w-12 -translate-x-1/2 border-4 border-black bg-cyan-700 shadow-[3px_3px_0_#000]" />
        <p className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-arcade text-white [text-shadow:2px_2px_0_#000]">Rocco</p>
      </div>
      <div className="relative mt-1 max-w-[470px] border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0_#000]">
        <div className="absolute -left-4 top-6 h-5 w-5 rotate-45 border-b-4 border-l-4 border-black bg-white" />
        <p className="text-sm lg:text-lg font-black leading-tight text-black">You are late for the activities!<br />Emanuel, the Trainer, is getting angry!</p>
      </div>
    </div>
  );
}

function Torch({ tick }: { tick: number }) {
  return (
    <div className="absolute left-1/2 top-1/2 z-20 h-7 w-4 -translate-x-1/2 -translate-y-1/2">
      <div className="absolute bottom-0 left-1/2 h-4 w-1 -translate-x-1/2 bg-[#3b2418]" />
      <div className={`absolute left-1/2 top-0 h-4 w-3 -translate-x-1/2 rounded-full ${tick % 2 ? 'bg-yellow-300' : 'bg-orange-500'} shadow-[0_0_12px_#fb923c]`} />
      <div className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-red-500" />
    </div>
  );
}

function PlayerSprite() {
  return (
    <div className="absolute inset-[12%] z-30">
      <div className="absolute left-1/2 top-0 h-[34%] w-[42%] -translate-x-1/2 rounded-full border-2 border-black bg-[#e8b27f]" />
      <div className="absolute left-[18%] top-[29%] h-[48%] w-[64%] border-2 border-black bg-[#2f8f8f]" />
      <div className="absolute left-[8%] top-[36%] h-[28%] w-[18%] border-2 border-black bg-[#e8b27f]" />
      <div className="absolute right-[8%] top-[36%] h-[28%] w-[18%] border-2 border-black bg-[#e8b27f]" />
      <div className="absolute left-[24%] bottom-0 h-[25%] w-[18%] border-2 border-black bg-[#2c2a28]" />
      <div className="absolute right-[24%] bottom-0 h-[25%] w-[18%] border-2 border-black bg-[#2c2a28]" />
      <div className="absolute left-[30%] top-[10%] h-1 w-1 rounded-full bg-black" />
      <div className="absolute right-[30%] top-[10%] h-1 w-1 rounded-full bg-black" />
    </div>
  );
}

function ParticipantDot({ index }: { key?: number; index: number }) {
  const colors = ['bg-cyan-600', 'bg-yellow-600', 'bg-pink-600', 'bg-green-600', 'bg-purple-600'];
  return (
    <span className="relative aspect-square">
      <span className="absolute left-1/2 top-0 h-[44%] w-[44%] -translate-x-1/2 rounded-full border border-black bg-[#f0bd88]" />
      <span className={`absolute bottom-0 left-[18%] right-[18%] h-[55%] border border-black ${colors[index % colors.length]}`} />
    </span>
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
  const exit = farthestFloor(grid, start);
  grid[start.y][start.x] = 'start';
  grid[exit.y][exit.x] = 'exit';

  decorate(grid, random, start, exit, level);
  return { grid, start, exit };
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
