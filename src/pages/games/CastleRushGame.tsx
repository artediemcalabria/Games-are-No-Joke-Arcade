import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Bell, Coffee, Focus, Gamepad2, HelpCircle, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { ManualButton, GameManualPanel, type ManualSection } from '../../components/GameManualPanel';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';

type Cell = '#' | '.' | ' ' | 'S' | 'G' | 'R' | 'C' | 'F' | 'B' | 'Y' | 'P';
type Point = { x: number; y: number };
type Direction = Point;
type Phase = 'intro' | 'playing' | 'paused' | 'won-level' | 'game-over' | 'completed';
type ClockKind = 'direct' | 'ambush' | 'patrol' | 'wander';
type ClockMode = 'scatter' | 'chase' | 'warning' | 'stunned';
type CollectibleKind = 'dot' | 'coffee' | 'focus' | 'bell' | 'star';

type ClockEnemy = {
  id: number;
  kind: ClockKind;
  x: number;
  y: number;
  dir: Direction;
  home: Point;
  scatter: Point;
  color: string;
  name: string;
};

type Collectible = {
  kind: CollectibleKind;
  x: number;
  y: number;
};

type LevelTemplate = {
  title: string;
  briefing: string;
  rows: string[];
  clocks: Array<{ kind: ClockKind; at: Point; scatter: Point }>;
  requiredReadiness: number;
  latePasses: number;
  latenessRate: number;
  playerSpeed: number;
  clockSpeed: number;
};

type ParsedLevel = {
  width: number;
  height: number;
  grid: Cell[][];
  start: Point;
  goal: Point;
  collectibles: Collectible[];
  clocks: ClockEnemy[];
  dotCount: number;
};

type GameRun = {
  level: number;
  phase: Phase;
  elapsed: number;
  readiness: number;
  score: number;
  lateness: number;
  latePasses: number;
  player: {
    x: number;
    y: number;
    dir: Direction;
    desired: Direction;
    invulnerable: number;
  };
  clocks: ClockEnemy[];
  collected: Set<string>;
  mode: ClockMode;
  focusUntil: number;
  coffeeUntil: number;
  bellUntil: number;
  roccoHint: string;
  lastLesson: string;
  discoveredStar: boolean;
};

const game = gameCatalog.find((item) => item.id === 'castle-rush')!;
const maxLevel = 10;
const zero = { x: 0, y: 0 };
const directions: Direction[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const clockStyles: Record<ClockKind, { color: string; name: string }> = {
  direct: { color: '#ff3b5f', name: 'Direct Clock' },
  ambush: { color: '#ffb020', name: 'Ambush Clock' },
  patrol: { color: '#44d7ff', name: 'Patrol Clock' },
  wander: { color: '#b56bff', name: 'Wander Clock' },
};

const designNotes = [
  'Readable enemies are fairer than random enemies.',
  'Loops give players choices under pressure.',
  'A shortcut is interesting only when its risk is visible.',
  'Checkpoints make pressure recoverable.',
  'Power states change the system, not only the score.',
  'A good enemy has a personality players can learn.',
  'A hard route still needs recovery space.',
  'Difficulty should ask for timing, not blind luck.',
  'The goal room must be part of the level design.',
  'A polished game teaches through movement, feedback, and mastery.',
];

const manualSections: ManualSection[] = [
  {
    title: 'Goal',
    items: [
      'You are a participant trying to reach the Activity Room on time.',
      'Collect enough check-in dots to become ready, then enter the center of the Activity Room.',
      'Rocco gives supportive logistics reminders. Emanuel and the group are waiting inside.',
    ],
  },
  {
    title: 'Controls',
    items: [
      'Use arrow keys or WASD on desktop.',
      'Use the D-pad on mobile.',
      'You can press a direction before a turn. The game will remember it when the corner opens.',
    ],
  },
  {
    title: 'Clocks',
    items: [
      'Red clocks chase directly.',
      'Orange clocks try to ambush the route ahead.',
      'Blue clocks protect corridors.',
      'Purple clocks wander, but they never camp the Activity Room.',
    ],
  },
  {
    title: 'Design Lesson',
    items: [
      'Pressure is fair when players can read it.',
      'A good maze has loops, recovery space, and meaningful shortcuts.',
      'Power-ups should change decisions, not only make numbers bigger.',
    ],
  },
];

export default function CastleRushGame() {
  const { completeGame, saveGameNote, updatePrototypeField } = useStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const runRef = useRef<GameRun | null>(null);
  const levelRef = useRef(1);
  const phaseRef = useRef<Phase>('intro');
  const [level, setLevel] = useState(1);
  const [highestLevel, setHighestLevel] = useState(1);
  const [phase, setPhase] = useState<Phase>('intro');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [hud, setHud] = useState({
    readiness: 0,
    lateness: 0,
    score: 0,
    latePasses: 3,
    mode: 'scatter' as ClockMode,
    roccoHint: 'Rocco says: watch the first clock pattern before moving.',
    lesson: designNotes[0],
  });
  const audioRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((frequency: number, duration = 0.08, type: OscillatorType = 'sine', gainValue = 0.065) => {
    if (!audioEnabled) return;
    const context = audioRef.current ?? new AudioContext();
    audioRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }, [audioEnabled]);

  const syncPhase = useCallback((nextPhase: Phase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
    if (runRef.current) runRef.current.phase = nextPhase;
  }, []);

  const startLevel = useCallback((nextLevel: number) => {
    const template = levelTemplates[nextLevel - 1];
    const parsed = parseLevel(template);
    const run: GameRun = {
      level: nextLevel,
      phase: 'playing',
      elapsed: 0,
      readiness: 0,
      score: 0,
      lateness: 8,
      latePasses: template.latePasses,
      player: {
        x: parsed.start.x + 0.5,
        y: parsed.start.y + 0.5,
        dir: zero,
        desired: zero,
        invulnerable: 1.5,
      },
      clocks: parsed.clocks,
      collected: new Set(),
      mode: 'scatter',
      focusUntil: 0,
      coffeeUntil: 0,
      bellUntil: 0,
      roccoHint: template.briefing,
      lastLesson: designNotes[nextLevel - 1],
      discoveredStar: false,
    };
    levelRef.current = nextLevel;
    runRef.current = run;
    setLevel(nextLevel);
    setHighestLevel((current) => Math.max(current, nextLevel));
    syncPhase('playing');
    saveGameNote(game.id, `Castle Rush: reached level ${nextLevel}/10`);
    playTone(520, 0.1, 'triangle');
  }, [playTone, saveGameNote, syncPhase]);

  const restart = useCallback(() => startLevel(levelRef.current), [startLevel]);

  const finishLevel = useCallback(() => {
    const run = runRef.current;
    if (!run || run.phase !== 'playing') return;
    playTone(run.level >= maxLevel ? 980 : 760, 0.18, 'sine', 0.08);
    if (run.level >= maxLevel) {
      syncPhase('completed');
      setHighestLevel(maxLevel);
      completeGame(game.id, 1000, game.takeaway, `Castle Rush completed: ${designNotes[maxLevel - 1]}`);
    } else {
      syncPhase('won-level');
      setHighestLevel((current) => Math.max(current, run.level + 1));
      saveGameNote(game.id, `Castle Rush: completed level ${run.level}/10 - ${designNotes[run.level - 1]}`);
    }
  }, [completeGame, playTone, saveGameNote, syncPhase]);

  const setDesiredDirection = useCallback((direction: Direction) => {
    const run = runRef.current;
    if (!run || run.phase !== 'playing') return;
    run.player.desired = direction;
  }, []);

  useEffect(() => {
    const parsed = parseLevel(levelTemplates[0]);
    runRef.current = {
      level: 1,
      phase: 'intro',
      elapsed: 0,
      readiness: 0,
      score: 0,
      lateness: 8,
      latePasses: levelTemplates[0].latePasses,
      player: { x: parsed.start.x + 0.5, y: parsed.start.y + 0.5, dir: zero, desired: zero, invulnerable: 0 },
      clocks: parsed.clocks,
      collected: new Set(),
      mode: 'scatter',
      focusUntil: 0,
      coffeeUntil: 0,
      bellUntil: 0,
      roccoHint: levelTemplates[0].briefing,
      lastLesson: designNotes[0],
      discoveredStar: false,
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
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
      if (!direction) return;
      event.preventDefault();
      setDesiredDirection(direction);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setDesiredDirection]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      const canvas = canvasRef.current;
      const run = runRef.current;
      if (!canvas || !run) {
        frameRef.current = window.requestAnimationFrame(loop);
        return;
      }
      const delta = Math.min(0.05, (timestamp - (lastTimeRef.current || timestamp)) / 1000);
      lastTimeRef.current = timestamp;
      const parsed = parseLevel(levelTemplates[run.level - 1]);
      if (run.phase === 'playing') updateRun(run, parsed, delta, finishLevel, syncPhase, playTone);
      drawGame(canvas, run, parsed);
      if (Math.floor(timestamp / 120) !== Math.floor((timestamp - delta * 1000) / 120)) {
        setHud({
          readiness: run.readiness,
          lateness: run.lateness,
          score: run.score,
          latePasses: run.latePasses,
          mode: run.mode,
          roccoHint: run.roccoHint,
          lesson: run.lastLesson,
        });
      }
      frameRef.current = window.requestAnimationFrame(loop);
    };
    frameRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [finishLevel, playTone, syncPhase]);

  const nextLevel = () => startLevel(Math.min(levelRef.current + 1, maxLevel));
  const togglePause = () => {
    if (phaseRef.current === 'playing') syncPhase('paused');
    else if (phaseRef.current === 'paused') syncPhase('playing');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="theme-game-screen mx-auto w-full max-w-6xl pb-10">
      <section className="mb-4 overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-950 shadow-[0_0_35px_rgba(34,211,238,.18)]">
        <div className="relative p-4 md:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(236,72,153,.18),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(34,211,238,.18),transparent_32%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-200">{game.subtitle}</p>
              <h1 className="mt-2 text-2xl font-arcade text-white mobile-readable-arcade md:text-4xl">{game.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-200">
                A polished clock-chase about arriving on time, reading pressure, and reaching the Activity Room with enough readiness.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ManualButton onClick={() => setManualOpen(true)} />
              <button onClick={() => setAudioEnabled((value) => !value)} className="rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-black uppercase text-gray-100 hover:border-cyan-300">
                {audioEnabled ? <Volume2 className="mr-2 inline h-4 w-4" /> : <VolumeX className="mr-2 inline h-4 w-4" />}
                Sound
              </button>
              <button onClick={togglePause} disabled={phase !== 'playing' && phase !== 'paused'} className="rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-black uppercase text-gray-100 hover:border-green-300 disabled:opacity-45">
                {phase === 'paused' ? <Play className="mr-2 inline h-4 w-4" /> : <Pause className="mr-2 inline h-4 w-4" />}
                {phase === 'paused' ? 'Resume' : 'Pause'}
              </button>
              <button onClick={restart} className="rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-black uppercase text-gray-100 hover:border-pink-300">
                <RotateCcw className="mr-2 inline h-4 w-4" />
                Restart
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="overflow-hidden rounded-2xl border border-cyan-300/35 bg-black shadow-[0_0_40px_rgba(0,242,255,.14)]">
          <CompactHud level={level} hud={hud} required={levelTemplates[level - 1].requiredReadiness} />
          <div className="relative aspect-square w-full bg-[#030714]">
            <canvas ref={canvasRef} className="h-full w-full touch-none" aria-label="Castle Rush game board" />
          </div>
          <DPad onMove={setDesiredDirection} />
        </div>

        <aside className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-1">
          <InfoCard title="Rocco Radio" color="cyan">
            {hud.roccoHint}
          </InfoCard>
          <InfoCard title="Clock Mode" color={hud.mode === 'warning' ? 'pink' : hud.mode === 'stunned' ? 'green' : 'yellow'}>
            {modeCopy(hud.mode)}
          </InfoCard>
          <InfoCard title="Design Note" color="green">
            {hud.lesson}
          </InfoCard>
          <div className="rounded-2xl border border-white/10 bg-black/55 p-4 md:col-span-3 xl:col-span-1">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Level Select</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {Array.from({ length: maxLevel }).map((_, index) => {
                const number = index + 1;
                const unlocked = number <= highestLevel;
                return (
                  <button
                    key={number}
                    onClick={() => unlocked && startLevel(number)}
                    disabled={!unlocked}
                    className={`h-10 rounded-xl border text-xs font-black ${number === level ? 'border-cyan-200 bg-cyan-300 text-black' : unlocked ? 'border-white/15 bg-white/5 text-gray-100 hover:border-cyan-300' : 'border-white/5 bg-white/5 text-gray-700'}`}
                  >
                    {number}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      {phase === 'intro' && (
        <Overlay title="Rocco Radio">
          <p className="text-lg font-black leading-relaxed text-white">Participants are late for the activities. Rocco reminds you to reach Emanuel and the group on time.</p>
          <p className="mt-4 text-sm leading-relaxed text-gray-300">{levelTemplates[0].briefing}</p>
          <button onClick={() => startLevel(1)} className="mt-6 rounded-xl border-2 border-cyan-300 bg-cyan-300 px-6 py-3 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_24px_rgba(34,211,238,.35)]">
            Start Running
          </button>
        </Overlay>
      )}

      {phase === 'paused' && (
        <Overlay title="Paused">
          <p className="text-lg font-black text-white">Look at the maze. The clocks have patterns, not random anger.</p>
          <button onClick={() => syncPhase('playing')} className="mt-6 rounded-xl border-2 border-cyan-300 bg-cyan-300 px-6 py-3 text-xs font-black uppercase tracking-widest text-black">
            Resume
          </button>
        </Overlay>
      )}

      {phase === 'won-level' && (
        <Overlay title="Activity Reached">
          <p className="text-lg font-black text-white">You reached the Activity Room with enough readiness.</p>
          <p className="mt-4 text-sm text-gray-300">{designNotes[levelRef.current - 1]}</p>
          <button onClick={nextLevel} className="mt-6 rounded-xl border-2 border-green-300 bg-green-300 px-6 py-3 text-xs font-black uppercase tracking-widest text-black">
            Next Level
          </button>
        </Overlay>
      )}

      {phase === 'game-over' && (
        <Overlay title="The Group Started">
          <p className="text-lg font-black text-white">The lateness bar filled up. Try reading the clock routes before sprinting.</p>
          <button onClick={restart} className="mt-6 rounded-xl border-2 border-pink-300 bg-pink-300 px-6 py-3 text-xs font-black uppercase tracking-widest text-black">
            Try Again
          </button>
        </Overlay>
      )}

      {phase === 'completed' && (
        <Overlay title="Training Saved">
          <p className="text-lg font-black text-white">You completed all 10 polished route challenges.</p>
          <div className="mt-5 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
            {[
              'Readable enemies feel fair.',
              'Loops create choice under pressure.',
              'Power-ups change the system.',
              'The goal room belongs inside the level.',
            ].map((line) => (
              <div key={line} className="rounded-xl border border-green-300/30 bg-green-300/10 p-3 text-sm font-bold text-green-100">{line}</div>
            ))}
          </div>
          <button
            onClick={() => updatePrototypeField('gameplayMechanics', game.prototypePrompt)}
            className="mt-6 rounded-xl border-2 border-green-300 bg-green-300 px-6 py-3 text-xs font-black uppercase tracking-widest text-black"
          >
            Send Takeaway to Prototype Lab
          </button>
        </Overlay>
      )}

      <GameManualPanel open={manualOpen} title="Castle Rush" sections={manualSections} onClose={() => setManualOpen(false)} />
    </motion.div>
  );
}

function updateRun(run: GameRun, parsed: ParsedLevel, delta: number, finishLevel: () => void, syncPhase: (phase: Phase) => void, playTone: (frequency: number, duration?: number, type?: OscillatorType, gain?: number) => void) {
  const template = levelTemplates[run.level - 1];
  run.elapsed += delta;
  run.player.invulnerable = Math.max(0, run.player.invulnerable - delta);
  run.mode = getClockMode(run);
  run.lateness = Math.min(100, run.lateness + template.latenessRate * delta * (run.coffeeUntil > run.elapsed ? 0.72 : 1));

  movePlayer(run, parsed, delta);
  collectAtPlayer(run, parsed, playTone);
  updateClocks(run, parsed, delta);

  for (const clock of run.clocks) {
    const distance = Math.hypot(clock.x - run.player.x, clock.y - run.player.y);
    if (distance < 0.55 && run.player.invulnerable <= 0 && run.mode !== 'stunned') {
      handleClockHit(run, parsed, playTone, syncPhase);
      break;
    }
  }

  const playerCell = cellAt(run.player);
  if (parsed.grid[playerCell.y]?.[playerCell.x] === 'G') {
    if (run.readiness >= template.requiredReadiness) {
      finishLevel();
    } else {
      run.roccoHint = `Rocco says: the Activity Room is open, but collect more check-ins first (${Math.round(run.readiness)}%/${template.requiredReadiness}%).`;
    }
  }

  if (run.lateness >= 100) {
    playTone(90, 0.3, 'sawtooth', 0.08);
    run.roccoHint = 'Rocco says: the session started. Restart and use the loops more calmly.';
    syncPhase('game-over');
  }
}

function movePlayer(run: GameRun, parsed: ParsedLevel, delta: number) {
  const player = run.player;
  const speed = levelTemplates[run.level - 1].playerSpeed * (run.coffeeUntil > run.elapsed ? 1.22 : 1);
  const center = nearestCenter(player);
  const nearCenter = Math.abs(player.x - center.x) < 0.11 && Math.abs(player.y - center.y) < 0.11;
  if (nearCenter && !sameDir(player.desired, zero) && canMove(parsed, cellAt(player), player.desired)) {
    player.x = center.x;
    player.y = center.y;
    player.dir = player.desired;
  }
  if (nearCenter && !canMove(parsed, cellAt(player), player.dir)) {
    player.x = center.x;
    player.y = center.y;
    player.dir = zero;
  }
  player.x += player.dir.x * speed * delta;
  player.y += player.dir.y * speed * delta;
  const afterCenter = nearestCenter(player);
  if (!canOccupy(parsed, { x: Math.floor(player.x), y: Math.floor(player.y) })) {
    player.x = afterCenter.x;
    player.y = afterCenter.y;
    player.dir = zero;
  }
}

function collectAtPlayer(run: GameRun, parsed: ParsedLevel, playTone: (frequency: number, duration?: number, type?: OscillatorType, gain?: number) => void) {
  const cell = cellAt(run.player);
  const key = keyOf(cell);
  if (run.collected.has(key)) return;
  const collectible = parsed.collectibles.find((item) => item.x === cell.x && item.y === cell.y);
  if (!collectible) return;
  run.collected.add(key);
  if (collectible.kind === 'dot') {
    run.score += 10;
    run.readiness = Math.min(100, (countCollectedDots(run, parsed) / parsed.dotCount) * 100);
    run.lateness = Math.max(0, run.lateness - 0.35);
    return;
  }
  if (collectible.kind === 'coffee') {
    run.coffeeUntil = run.elapsed + 6;
    run.score += 80;
    run.roccoHint = 'Coffee gives rhythm. Move faster, but still read the clocks.';
    playTone(720, 0.08, 'triangle');
  }
  if (collectible.kind === 'focus') {
    run.focusUntil = run.elapsed + 4.5;
    run.score += 100;
    run.roccoHint = 'Focus freezes the clocks. Use the window to cross a risky lane.';
    playTone(540, 0.1, 'sine');
  }
  if (collectible.kind === 'bell') {
    run.bellUntil = run.elapsed + 5.5;
    run.score += 90;
    run.roccoHint = 'Bell reveals the safest route toward the Activity Room.';
    playTone(860, 0.1, 'sine');
  }
  if (collectible.kind === 'star') {
    run.discoveredStar = true;
    run.score += 180;
    run.lastLesson = 'Bonus note: optional rewards are strongest when they reveal a design idea.';
    playTone(980, 0.14, 'sine', 0.08);
  }
}

function updateClocks(run: GameRun, parsed: ParsedLevel, delta: number) {
  if (run.mode === 'stunned') return;
  const template = levelTemplates[run.level - 1];
  const speedMultiplier = run.mode === 'warning' ? 0.62 : run.mode === 'scatter' ? 0.82 : 1;
  const speed = template.clockSpeed * speedMultiplier;
  for (const clock of run.clocks) {
    const center = nearestCenter(clock);
    const nearCenter = Math.abs(clock.x - center.x) < 0.06 && Math.abs(clock.y - center.y) < 0.06;
    if (nearCenter) {
      clock.x = center.x;
      clock.y = center.y;
      const target = getClockTarget(clock, run, parsed);
      const next = nextStepToward(parsed, cellAt(clock), target, clock.dir);
      clock.dir = next ? { x: next.x - Math.floor(clock.x), y: next.y - Math.floor(clock.y) } : clock.dir;
    }
    clock.x += clock.dir.x * speed * delta;
    clock.y += clock.dir.y * speed * delta;
  }
}

function handleClockHit(run: GameRun, parsed: ParsedLevel, playTone: (frequency: number, duration?: number, type?: OscillatorType, gain?: number) => void, syncPhase: (phase: Phase) => void) {
  playTone(110, 0.18, 'sawtooth', 0.08);
  run.latePasses -= 1;
  run.lateness = Math.min(100, run.lateness + 16 + run.level);
  run.player.x = parsed.start.x + 0.5;
  run.player.y = parsed.start.y + 0.5;
  run.player.dir = zero;
  run.player.desired = zero;
  run.player.invulnerable = 2;
  run.roccoHint = run.latePasses > 0
    ? `Rocco says: late pass used. You have ${run.latePasses} recovery chance${run.latePasses === 1 ? '' : 's'} left.`
    : 'Rocco says: no late passes left. One more hit will end the run.';
  if (run.latePasses < 0) syncPhase('game-over');
}

function drawGame(canvas: HTMLCanvasElement, run: GameRun, parsed: ParsedLevel) {
  const parent = canvas.parentElement;
  const rect = parent?.getBoundingClientRect();
  const cssSize = Math.floor(Math.min(rect?.width ?? 720, rect?.height ?? 720));
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== cssSize * dpr || canvas.height !== cssSize * dpr) {
    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
  }
  const context = canvas.getContext('2d');
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssSize, cssSize);
  context.fillStyle = '#030714';
  context.fillRect(0, 0, cssSize, cssSize);
  const tile = cssSize / Math.max(parsed.width, parsed.height);
  const offsetX = (cssSize - parsed.width * tile) / 2;
  const offsetY = (cssSize - parsed.height * tile) / 2;

  drawFloor(context, parsed, tile, offsetX, offsetY);
  drawPathHint(context, run, parsed, tile, offsetX, offsetY);
  drawCollectibles(context, run, parsed, tile, offsetX, offsetY);
  drawActivityRoom(context, run, parsed, tile, offsetX, offsetY);
  for (const clock of run.clocks) drawClock(context, clock, run, tile, offsetX, offsetY);
  drawPlayer(context, run, tile, offsetX, offsetY);
}

function drawFloor(context: CanvasRenderingContext2D, parsed: ParsedLevel, tile: number, offsetX: number, offsetY: number) {
  for (let y = 0; y < parsed.height; y++) {
    for (let x = 0; x < parsed.width; x++) {
      const cell = parsed.grid[y][x];
      const px = offsetX + x * tile;
      const py = offsetY + y * tile;
      if (cell === '#') {
        context.fillStyle = '#063447';
        roundRect(context, px + tile * 0.08, py + tile * 0.08, tile * 0.84, tile * 0.84, tile * 0.18);
        context.fill();
        context.strokeStyle = 'rgba(102, 232, 255, 0.45)';
        context.lineWidth = Math.max(1, tile * 0.035);
        context.stroke();
      } else {
        context.fillStyle = cell === 'R' || cell === 'G' ? 'rgba(16,185,129,.15)' : '#07111f';
        context.fillRect(px, py, tile, tile);
        context.strokeStyle = 'rgba(148, 163, 184, 0.055)';
        context.lineWidth = 1;
        context.strokeRect(px, py, tile, tile);
      }
    }
  }
}

function drawCollectibles(context: CanvasRenderingContext2D, run: GameRun, parsed: ParsedLevel, tile: number, offsetX: number, offsetY: number) {
  for (const item of parsed.collectibles) {
    if (run.collected.has(keyOf(item))) continue;
    const x = offsetX + (item.x + 0.5) * tile;
    const y = offsetY + (item.y + 0.5) * tile;
    if (item.kind === 'dot') {
      context.fillStyle = 'rgba(190, 244, 255, 0.78)';
      context.beginPath();
      context.arc(x, y, tile * 0.08, 0, Math.PI * 2);
      context.fill();
      continue;
    }
    const color = item.kind === 'coffee' ? '#facc15' : item.kind === 'focus' ? '#86efac' : item.kind === 'bell' ? '#f0abfc' : '#fde68a';
    context.fillStyle = color;
    context.shadowBlur = tile * 0.4;
    context.shadowColor = color;
    context.beginPath();
    context.arc(x, y, tile * 0.28, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = '#08111f';
    context.font = `${tile * 0.34}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(item.kind === 'coffee' ? 'C' : item.kind === 'focus' ? 'F' : item.kind === 'bell' ? 'B' : '★', x, y + tile * 0.02);
  }
}

function drawActivityRoom(context: CanvasRenderingContext2D, run: GameRun, parsed: ParsedLevel, tile: number, offsetX: number, offsetY: number) {
  const roomCells: Point[] = [];
  parsed.grid.forEach((row, y) => row.forEach((cell, x) => {
    if (cell === 'R' || cell === 'G') roomCells.push({ x, y });
  }));
  if (!roomCells.length) return;
  const minX = Math.min(...roomCells.map((cell) => cell.x));
  const minY = Math.min(...roomCells.map((cell) => cell.y));
  const maxX = Math.max(...roomCells.map((cell) => cell.x));
  const maxY = Math.max(...roomCells.map((cell) => cell.y));
  const x = offsetX + minX * tile;
  const y = offsetY + minY * tile;
  const width = (maxX - minX + 1) * tile;
  const height = (maxY - minY + 1) * tile;
  context.fillStyle = 'rgba(34,197,94,.12)';
  context.strokeStyle = run.readiness >= levelTemplates[run.level - 1].requiredReadiness ? '#86efac' : 'rgba(134,239,172,.42)';
  context.lineWidth = Math.max(2, tile * 0.05);
  roundRect(context, x + tile * 0.12, y + tile * 0.12, width - tile * 0.24, height - tile * 0.24, tile * 0.45);
  context.fill();
  context.stroke();
  const centerX = offsetX + (parsed.goal.x + 0.5) * tile;
  const centerY = offsetY + (parsed.goal.y + 0.5) * tile;
  for (let index = 0; index < 18; index++) {
    const angle = (Math.PI * 2 * index) / 18;
    const chairX = centerX + Math.cos(angle) * width * 0.32;
    const chairY = centerY + Math.sin(angle) * height * 0.30;
    context.fillStyle = '#f8fafc';
    context.beginPath();
    context.arc(chairX, chairY, tile * 0.11, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = '#facc15';
  context.beginPath();
  context.arc(centerX, centerY, tile * 0.22, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#052e16';
  context.font = `${tile * 0.32}px sans-serif`;
  context.textAlign = 'center';
  context.fillText('E', centerX, centerY + tile * 0.11);
}

function drawPathHint(context: CanvasRenderingContext2D, run: GameRun, parsed: ParsedLevel, tile: number, offsetX: number, offsetY: number) {
  if (run.bellUntil <= run.elapsed) return;
  const path = findPath(parsed, cellAt(run.player), parsed.goal).slice(0, 18);
  context.fillStyle = 'rgba(253, 224, 71, 0.42)';
  for (const point of path) {
    context.beginPath();
    context.arc(offsetX + (point.x + 0.5) * tile, offsetY + (point.y + 0.5) * tile, tile * 0.15, 0, Math.PI * 2);
    context.fill();
  }
}

function drawPlayer(context: CanvasRenderingContext2D, run: GameRun, tile: number, offsetX: number, offsetY: number) {
  const x = offsetX + run.player.x * tile;
  const y = offsetY + run.player.y * tile;
  const pulse = 1 + Math.sin(run.elapsed * 12) * 0.04;
  context.fillStyle = run.player.invulnerable > 0 && Math.floor(run.elapsed * 10) % 2 === 0 ? '#fef08a' : '#fde047';
  context.shadowBlur = tile * 0.35;
  context.shadowColor = '#facc15';
  context.beginPath();
  context.arc(x, y, tile * 0.36 * pulse, 0.25 * Math.PI, 1.75 * Math.PI);
  context.lineTo(x, y);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = '#111827';
  context.beginPath();
  context.arc(x + tile * 0.11, y - tile * 0.14, tile * 0.055, 0, Math.PI * 2);
  context.fill();
}

function drawClock(context: CanvasRenderingContext2D, clock: ClockEnemy, run: GameRun, tile: number, offsetX: number, offsetY: number) {
  const x = offsetX + clock.x * tile;
  const y = offsetY + clock.y * tile;
  const stunned = run.mode === 'stunned';
  const color = stunned ? '#94a3b8' : run.mode === 'warning' && Math.floor(run.elapsed * 8) % 2 === 0 ? '#ffffff' : clock.color;
  context.fillStyle = color;
  context.shadowBlur = tile * 0.4;
  context.shadowColor = color;
  context.beginPath();
  context.arc(x, y, tile * 0.35, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = '#0f172a';
  context.lineWidth = Math.max(2, tile * 0.06);
  context.beginPath();
  context.arc(x, y, tile * 0.22, 0, Math.PI * 2);
  context.stroke();
  const handAngle = run.elapsed * 5 + clock.id;
  context.strokeStyle = '#0f172a';
  context.lineWidth = Math.max(2, tile * 0.045);
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + Math.cos(handAngle) * tile * 0.16, y + Math.sin(handAngle) * tile * 0.16);
  context.stroke();
}

function CompactHud({ level, hud, required }: { level: number; hud: { readiness: number; lateness: number; score: number; latePasses: number; mode: ClockMode }; required: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 border-b border-cyan-300/20 bg-slate-950/95 p-3 text-xs font-black uppercase text-gray-100 md:grid-cols-5">
      <HudItem label="Level" value={`${level}/10`} />
      <HudItem label="Readiness" value={`${Math.round(hud.readiness)}%/${required}%`} tone="cyan" />
      <HudItem label="Lateness" value={`${Math.round(hud.lateness)}%`} tone={hud.lateness > 75 ? 'pink' : 'yellow'} />
      <HudItem label="Late Passes" value={String(Math.max(0, hud.latePasses))} tone="green" />
      <HudItem label="Score" value={String(hud.score)} />
    </div>
  );
}

function HudItem({ label, value, tone = 'white' }: { label: string; value: string; tone?: 'white' | 'cyan' | 'pink' | 'yellow' | 'green' }) {
  const color = tone === 'cyan' ? 'text-cyan-200' : tone === 'pink' ? 'text-pink-200' : tone === 'yellow' ? 'text-yellow-200' : tone === 'green' ? 'text-green-200' : 'text-white';
  return (
    <div className="rounded-xl border border-white/10 bg-black/45 p-2">
      <p className="text-[9px] tracking-widest text-gray-500">{label}</p>
      <p className={`mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function DPad({ onMove }: { onMove: (direction: Direction) => void }) {
  const handlePointer = (event: PointerEvent<HTMLButtonElement>, direction: Direction) => {
    event.preventDefault();
    onMove(direction);
  };
  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-cyan-300/20 bg-slate-950/95 p-3 xl:hidden">
      <div />
      <div className="grid w-44 grid-cols-3 gap-2">
        <span />
        <PadButton label="Up" onPointerDown={(event) => handlePointer(event, { x: 0, y: -1 })} />
        <span />
        <PadButton label="Left" onPointerDown={(event) => handlePointer(event, { x: -1, y: 0 })} />
        <div className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-black/55">
          <Gamepad2 className="h-5 w-5 text-cyan-200" />
        </div>
        <PadButton label="Right" onPointerDown={(event) => handlePointer(event, { x: 1, y: 0 })} />
        <span />
        <PadButton label="Down" onPointerDown={(event) => handlePointer(event, { x: 0, y: 1 })} />
        <span />
      </div>
      <div />
    </div>
  );
}

function PadButton({ label, onPointerDown }: { label: string; onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void }) {
  return (
    <button onPointerDown={onPointerDown} className="h-12 rounded-xl border border-cyan-300/45 bg-cyan-300/10 text-[10px] font-black uppercase text-cyan-100 active:bg-cyan-300 active:text-black">
      {label}
    </button>
  );
}

function InfoCard({ title, color, children }: { title: string; color: 'cyan' | 'pink' | 'green' | 'yellow'; children: string }) {
  const classes = {
    cyan: 'border-cyan-300/25 text-cyan-200',
    pink: 'border-pink-300/25 text-pink-200',
    green: 'border-green-300/25 text-green-200',
    yellow: 'border-yellow-300/25 text-yellow-200',
  };
  return (
    <div className={`rounded-2xl border bg-black/55 p-4 ${classes[color]}`}>
      <p className="text-xs font-black uppercase tracking-widest">{title}</p>
      <p className="mt-3 text-sm font-bold leading-relaxed text-gray-100">{children}</p>
    </div>
  );
}

function Overlay({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/82 p-4 backdrop-blur-md">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl rounded-3xl border border-cyan-300/40 bg-slate-950/95 p-6 text-center shadow-[0_0_42px_rgba(34,211,238,.22)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/35 bg-cyan-300/10 text-cyan-200">
          <HelpCircle className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-arcade text-white mobile-readable-arcade">{title}</h2>
        <div className="mt-5">{children}</div>
      </motion.div>
    </div>
  );
}

function parseLevel(template: LevelTemplate): ParsedLevel {
  const width = Math.max(...template.rows.map((row) => row.length));
  const height = template.rows.length;
  const grid = template.rows.map((row) => row.padEnd(width, '#').split('') as Cell[]);
  let start = { x: 1, y: 1 };
  let goal = { x: width - 2, y: 1 };
  const collectibles: Collectible[] = [];
  let dotCount = 0;

  grid.forEach((row, y) => row.forEach((cell, x) => {
    if (cell === 'S') {
      start = { x, y };
      collectibles.push({ kind: 'dot', x, y });
      dotCount += 1;
    }
    if (cell === 'G') goal = { x, y };
    if (cell === '.') {
      collectibles.push({ kind: 'dot', x, y });
      dotCount += 1;
    }
    if (cell === 'C') collectibles.push({ kind: 'coffee', x, y });
    if (cell === 'F') collectibles.push({ kind: 'focus', x, y });
    if (cell === 'B') collectibles.push({ kind: 'bell', x, y });
    if (cell === 'Y') collectibles.push({ kind: 'star', x, y });
  }));

  const clocks = template.clocks.map((clock, id) => ({
    id,
    kind: clock.kind,
    x: clock.at.x + 0.5,
    y: clock.at.y + 0.5,
    dir: zero,
    home: clock.at,
    scatter: clock.scatter,
    color: clockStyles[clock.kind].color,
    name: clockStyles[clock.kind].name,
  }));

  return { width, height, grid, start, goal, collectibles, clocks, dotCount };
}

function getClockMode(run: GameRun): ClockMode {
  if (run.focusUntil > run.elapsed) return 'stunned';
  const cycle = run.elapsed % 14;
  if (cycle > 12.4) return 'warning';
  return cycle < 5 ? 'scatter' : 'chase';
}

function getClockTarget(clock: ClockEnemy, run: GameRun, parsed: ParsedLevel): Point {
  if (run.mode === 'scatter') return clock.scatter;
  const playerCell = cellAt(run.player);
  if (clock.kind === 'direct') return playerCell;
  if (clock.kind === 'ambush') {
    return clampPoint(parsed, {
      x: playerCell.x + run.player.dir.x * 3,
      y: playerCell.y + run.player.dir.y * 3,
    });
  }
  if (clock.kind === 'patrol') return run.readiness > 65 ? parsed.goal : clock.home;
  const options = directions
    .map((direction) => ({ x: Math.floor(clock.x) + direction.x, y: Math.floor(clock.y) + direction.y }))
    .filter((point) => canOccupy(parsed, point) && parsed.grid[point.y][point.x] !== 'R' && parsed.grid[point.y][point.x] !== 'G');
  return options[(Math.floor(run.elapsed * 2 + clock.id) % Math.max(1, options.length))] ?? clock.scatter;
}

function nextStepToward(parsed: ParsedLevel, from: Point, target: Point, currentDir: Direction) {
  const options = directions
    .map((direction) => ({ x: from.x + direction.x, y: from.y + direction.y, direction }))
    .filter((option) => canOccupy(parsed, option) && parsed.grid[option.y][option.x] !== 'R' && parsed.grid[option.y][option.x] !== 'G');
  if (!options.length) return null;
  const path = findPath(parsed, from, target, true);
  if (path[1]) return path[1];
  return options.sort((a, b) => {
    const aReverse = a.direction.x === -currentDir.x && a.direction.y === -currentDir.y ? 2 : 0;
    const bReverse = b.direction.x === -currentDir.x && b.direction.y === -currentDir.y ? 2 : 0;
    return manhattan(a, target) + aReverse - (manhattan(b, target) + bReverse);
  })[0];
}

function findPath(parsed: ParsedLevel, start: Point, goal: Point, blockRoom = false) {
  const queue = [start];
  const visited = new Set([keyOf(start)]);
  const previous = new Map<string, Point>();
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (samePoint(current, goal)) break;
    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = keyOf(next);
      const cell = parsed.grid[next.y]?.[next.x];
      if (visited.has(key) || !canOccupy(parsed, next)) continue;
      if (blockRoom && (cell === 'R' || cell === 'G')) continue;
      visited.add(key);
      previous.set(key, current);
      queue.push(next);
    }
  }
  const path: Point[] = [];
  let current = goal;
  while (!samePoint(current, start) && previous.has(keyOf(current))) {
    path.unshift(current);
    current = previous.get(keyOf(current))!;
  }
  return [start, ...path];
}

function modeCopy(mode: ClockMode) {
  if (mode === 'scatter') return 'Clocks return to their corners. Use this time to plan.';
  if (mode === 'warning') return 'Clocks are flashing. A chase wave is about to change.';
  if (mode === 'stunned') return 'Focus is active. Clocks are paused for a short window.';
  return 'Clocks are chasing with different personalities. Read who is doing what.';
}

function canMove(parsed: ParsedLevel, cell: Point, direction: Direction) {
  return canOccupy(parsed, { x: cell.x + direction.x, y: cell.y + direction.y });
}

function canOccupy(parsed: ParsedLevel, point: Point) {
  const cell = parsed.grid[point.y]?.[point.x];
  return Boolean(cell && cell !== '#');
}

function nearestCenter(point: { x: number; y: number }) {
  return { x: Math.floor(point.x) + 0.5, y: Math.floor(point.y) + 0.5 };
}

function cellAt(point: { x: number; y: number }) {
  return { x: Math.floor(point.x), y: Math.floor(point.y) };
}

function clampPoint(parsed: ParsedLevel, point: Point) {
  return {
    x: Math.max(1, Math.min(parsed.width - 2, point.x)),
    y: Math.max(1, Math.min(parsed.height - 2, point.y)),
  };
}

function keyOf(point: Point) {
  return `${point.x},${point.y}`;
}

function sameDir(a: Direction, b: Direction) {
  return a.x === b.x && a.y === b.y;
}

function samePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function manhattan(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function countCollectedDots(run: GameRun, parsed: ParsedLevel) {
  return parsed.collectibles.filter((item) => item.kind === 'dot' && run.collected.has(keyOf(item))).length;
}

const levelTemplates: LevelTemplate[] = [
  {
    title: 'First Bell',
    briefing: 'Rocco says: collect check-ins, then enter the Activity Room when you are ready.',
    requiredReadiness: 54,
    latePasses: 3,
    latenessRate: 2.4,
    playerSpeed: 4.8,
    clockSpeed: 3.2,
    rows: [
      '###################',
      '#S....#.....#....C#',
      '#.###.#.###.#.###.#',
      '#...#...#...#...#.#',
      '###.###.#.###.#.#.#',
      '#.....#...#...#...#',
      '#.###.###.#.###.###',
      '#...#.....#.....#B#',
      '#.#.#####.#####.#.#',
      '#.#.......P.....#.#',
      '#.#.###.RRR.###.#.#',
      '#...#...RGR...#...#',
      '###.#.##RRR##.#.###',
      '#...#.....#.....#Y#',
      '#.###.###.#.###.###',
      '#F....#.....#.....#',
      '###################',
    ],
    clocks: [
      { kind: 'direct', at: { x: 9, y: 9 }, scatter: { x: 1, y: 1 } },
      { kind: 'patrol', at: { x: 5, y: 7 }, scatter: { x: 17, y: 1 } },
    ],
  },
  {
    title: 'Two Loops',
    briefing: 'Rocco says: there are two loops. Do not force the center when a clock is entering it.',
    requiredReadiness: 58,
    latePasses: 3,
    latenessRate: 2.6,
    playerSpeed: 4.85,
    clockSpeed: 3.35,
    rows: [
      '###################',
      '#S..C....#....B...#',
      '#.#####..#..#####.#',
      '#.....#.....#.....#',
      '#####.#.###.#.#####',
      '#.....#..F..#.....#',
      '#.###.#######.###.#',
      '#.#.............#.#',
      '#.#.###.RRR.###.#.#',
      '#...#...RGR...#...#',
      '#.#.###.RRR.###.#.#',
      '#.#.............#.#',
      '#.###.###.###.###.#',
      '#.....#.....#.....#',
      '#.###.#.###.#.###.#',
      '#Y....#.....#.....#',
      '###################',
    ],
    clocks: [
      { kind: 'direct', at: { x: 9, y: 7 }, scatter: { x: 1, y: 1 } },
      { kind: 'ambush', at: { x: 9, y: 11 }, scatter: { x: 17, y: 1 } },
    ],
  },
  {
    title: 'Ambush Lesson',
    briefing: 'Rocco says: orange clocks aim ahead. Turn early and use side corridors.',
    requiredReadiness: 60,
    latePasses: 3,
    latenessRate: 2.8,
    playerSpeed: 4.9,
    clockSpeed: 3.45,
    rows: [
      '###################',
      '#S....#...C.#.....#',
      '#.###.#.###.#.###.#',
      '#B..#.........#...#',
      '###.#.#######.#.###',
      '#...#....F....#...#',
      '#.#####.###.#####.#',
      '#.......#.#.......#',
      '#.#####.#.#.#####.#',
      '#.....#RRGRR#.....#',
      '#####.#RRRRR#.#####',
      '#.....#.....#.....#',
      '#.###.###.###.###.#',
      '#...#.........#...#',
      '###.#.#######.#.###',
      '#Y....#.....#.....#',
      '###################',
    ],
    clocks: [
      { kind: 'direct', at: { x: 4, y: 7 }, scatter: { x: 1, y: 15 } },
      { kind: 'ambush', at: { x: 14, y: 7 }, scatter: { x: 17, y: 1 } },
      { kind: 'wander', at: { x: 9, y: 11 }, scatter: { x: 17, y: 15 } },
    ],
  },
  {
    title: 'Recovery Corners',
    briefing: 'Rocco says: corners are safe only if you arrive before the chase wave.',
    requiredReadiness: 62,
    latePasses: 3,
    latenessRate: 3,
    playerSpeed: 5,
    clockSpeed: 3.55,
    rows: [
      '###################',
      '#S..#.....#.....C.#',
      '#.#.#.###.#.###.#.#',
      '#.#...#.....#...#.#',
      '#.#####.###.#####.#',
      '#.....#..B..#.....#',
      '#####.#######.#####',
      '#.....#.....#.....#',
      '#.###.#.RRR.#.###.#',
      '#...#...RGR...#...#',
      '#.###.#.RRR.#.###.#',
      '#.....#.....#.....#',
      '#####.###.###.#####',
      '#F....#.....#....Y#',
      '#.###.#######.###.#',
      '#.................#',
      '###################',
    ],
    clocks: [
      { kind: 'direct', at: { x: 9, y: 7 }, scatter: { x: 1, y: 1 } },
      { kind: 'patrol', at: { x: 5, y: 11 }, scatter: { x: 1, y: 15 } },
      { kind: 'ambush', at: { x: 13, y: 11 }, scatter: { x: 17, y: 1 } },
    ],
  },
  {
    title: 'Power State',
    briefing: 'Rocco says: Focus is not decoration. Use it when two clocks cross.',
    requiredReadiness: 64,
    latePasses: 3,
    latenessRate: 3.15,
    playerSpeed: 5,
    clockSpeed: 3.7,
    rows: [
      '###################',
      '#S....#.....#....C#',
      '#.###.#.###.#.###.#',
      '#...#.#.....#.#...#',
      '###.#.#.###.#.#.###',
      '#...#...#B#...#...#',
      '#.#####.#.#.#####.#',
      '#.......#.#.......#',
      '#.###.##RRR##.###.#',
      '#.....#.RGR.#.....#',
      '#.###.##RRR##.###.#',
      '#.......#.#.......#',
      '#.#####.#.#.#####.#',
      '#...F...#.#...Y...#',
      '#.###.###.###.###.#',
      '#.................#',
      '###################',
    ],
    clocks: [
      { kind: 'direct', at: { x: 9, y: 7 }, scatter: { x: 1, y: 1 } },
      { kind: 'ambush', at: { x: 9, y: 11 }, scatter: { x: 17, y: 1 } },
      { kind: 'patrol', at: { x: 4, y: 13 }, scatter: { x: 1, y: 15 } },
    ],
  },
  {
    title: 'Four Personalities',
    briefing: 'Rocco says: each clock has a different logic. Learn them before rushing.',
    requiredReadiness: 66,
    latePasses: 3,
    latenessRate: 3.25,
    playerSpeed: 5.05,
    clockSpeed: 3.75,
    rows: [
      '###################',
      '#S..C....#....B...#',
      '#.#####..#..#####.#',
      '#.....#.....#.....#',
      '###.#.#.###.#.#.###',
      '#...#.#.....#.#...#',
      '#.###.#######.###.#',
      '#.................#',
      '#.#####.RRR.#####.#',
      '#.....#.RGR.#.....#',
      '#.#####.RRR.#####.#',
      '#.................#',
      '#.###.###.###.###.#',
      '#F....#.....#....Y#',
      '#.###.#.###.#.###.#',
      '#.....#.....#.....#',
      '###################',
    ],
    clocks: [
      { kind: 'direct', at: { x: 3, y: 7 }, scatter: { x: 1, y: 1 } },
      { kind: 'ambush', at: { x: 15, y: 7 }, scatter: { x: 17, y: 1 } },
      { kind: 'patrol', at: { x: 3, y: 11 }, scatter: { x: 1, y: 15 } },
      { kind: 'wander', at: { x: 15, y: 11 }, scatter: { x: 17, y: 15 } },
    ],
  },
  {
    title: 'Side Door',
    briefing: 'Rocco says: the fastest route is not always the safest route.',
    requiredReadiness: 68,
    latePasses: 2,
    latenessRate: 3.4,
    playerSpeed: 5.1,
    clockSpeed: 3.85,
    rows: [
      '###################',
      '#S....#.....#....C#',
      '#.###.#.###.#.###.#',
      '#.#...#.....#...#.#',
      '#.#.#####.#####.#.#',
      '#...#.........#...#',
      '###.#.###B###.#.###',
      '#.....#.....#.....#',
      '#.###.#.RRR.#.###.#',
      '#...#...RGR...#...#',
      '#.###.#.RRR.#.###.#',
      '#.....#.....#.....#',
      '###.#.###.###.#.###',
      '#...#....F....#...#',
      '#.#####.###.#####.#',
      '#Y................#',
      '###################',
    ],
    clocks: [
      { kind: 'direct', at: { x: 5, y: 7 }, scatter: { x: 1, y: 1 } },
      { kind: 'ambush', at: { x: 13, y: 7 }, scatter: { x: 17, y: 1 } },
      { kind: 'patrol', at: { x: 5, y: 13 }, scatter: { x: 1, y: 15 } },
      { kind: 'wander', at: { x: 13, y: 13 }, scatter: { x: 17, y: 15 } },
    ],
  },
  {
    title: 'Timing Window',
    briefing: 'Rocco says: wait for scatter mode, then cross the middle.',
    requiredReadiness: 70,
    latePasses: 2,
    latenessRate: 3.55,
    playerSpeed: 5.15,
    clockSpeed: 3.95,
    rows: [
      '###################',
      '#S..C#.......#B...#',
      '#.##.#.#####.#.##.#',
      '#....#...F...#....#',
      '####.###.#.###.####',
      '#........#........#',
      '#.######.#.######.#',
      '#.#............Y#.#',
      '#.#.####RRR####.#.#',
      '#.....#.RGR.#.....#',
      '#.#.####RRR####.#.#',
      '#.#.............#.#',
      '#.######.#.######.#',
      '#........#........#',
      '#.##.###.#.###.##.#',
      '#.................#',
      '###################',
    ],
    clocks: [
      { kind: 'direct', at: { x: 4, y: 5 }, scatter: { x: 1, y: 1 } },
      { kind: 'ambush', at: { x: 14, y: 5 }, scatter: { x: 17, y: 1 } },
      { kind: 'patrol', at: { x: 4, y: 13 }, scatter: { x: 1, y: 15 } },
      { kind: 'wander', at: { x: 14, y: 13 }, scatter: { x: 17, y: 15 } },
    ],
  },
  {
    title: 'Readable Pressure',
    briefing: 'Rocco says: use Bell to read the route, then commit.',
    requiredReadiness: 72,
    latePasses: 2,
    latenessRate: 3.7,
    playerSpeed: 5.2,
    clockSpeed: 4.05,
    rows: [
      '###################',
      '#S....#..C..#....B#',
      '#.###.#.###.#.###.#',
      '#...#.........#...#',
      '###.#.#######.#.###',
      '#...#....F....#...#',
      '#.#####.###.#####.#',
      '#.......#.#.......#',
      '#.###.##RRR##.###.#',
      '#.....#.RGR.#.....#',
      '#.###.##RRR##.###.#',
      '#.......#.#.......#',
      '#.#####.#.#.#####.#',
      '#...#.........#...#',
      '###.#.#######.#.###',
      '#Y................#',
      '###################',
    ],
    clocks: [
      { kind: 'direct', at: { x: 3, y: 7 }, scatter: { x: 1, y: 1 } },
      { kind: 'ambush', at: { x: 15, y: 7 }, scatter: { x: 17, y: 1 } },
      { kind: 'patrol', at: { x: 9, y: 5 }, scatter: { x: 1, y: 15 } },
      { kind: 'wander', at: { x: 9, y: 13 }, scatter: { x: 17, y: 15 } },
    ],
  },
  {
    title: 'Final Arrival',
    briefing: 'Rocco says: master the pattern. The Activity Room is close, but readiness still matters.',
    requiredReadiness: 74,
    latePasses: 2,
    latenessRate: 3.85,
    playerSpeed: 5.25,
    clockSpeed: 4.15,
    rows: [
      '###################',
      '#S..C....#....B...#',
      '#.#####..#..#####.#',
      '#.....#.....#.....#',
      '#.###.#.###.#.###.#',
      '#...#.........#...#',
      '###.#.#######.#.###',
      '#.....#..F..#.....#',
      '#.###.#.RRR.#.###.#',
      '#...#...RGR...#...#',
      '#.###.#.RRR.#.###.#',
      '#.....#.....#.....#',
      '###.#.###.###.#.###',
      '#...#.........#...#',
      '#.#####.###.#####.#',
      '#Y................#',
      '###################',
    ],
    clocks: [
      { kind: 'direct', at: { x: 3, y: 5 }, scatter: { x: 1, y: 1 } },
      { kind: 'ambush', at: { x: 15, y: 5 }, scatter: { x: 17, y: 1 } },
      { kind: 'patrol', at: { x: 3, y: 13 }, scatter: { x: 1, y: 15 } },
      { kind: 'wander', at: { x: 15, y: 13 }, scatter: { x: 17, y: 15 } },
    ],
  },
];
