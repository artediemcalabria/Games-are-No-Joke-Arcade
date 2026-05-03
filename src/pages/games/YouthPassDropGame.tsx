import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Beer, ChevronLeft, ChevronRight, Coffee, Droplets, RotateCcw, Trophy, Volume2, VolumeX, Wine } from 'lucide-react';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';

type ItemType = 'water' | 'coffee' | 'beer' | 'wine';
type Phase = 'name' | 'ready' | 'playing' | 'level-won' | 'game-over' | 'completed';
type FallingItem = { id: number; type: ItemType; x: number; y: number; speed: number; drift: number };
type Meters = { life: number; energy: number; happiness: number };

const game = gameCatalog.find((item) => item.id === 'youthpass-drop')!;
const maxLevel = 10;

const designNotes = [
  'Level 1: Meters are not just scores. They show consequences players can feel.',
  'Level 2: Positive feedback makes players understand what helps them.',
  'Level 3: A risk item becomes meaningful when its later cost is visible.',
  'Level 4: Speed changes make the body feel the resource system.',
  'Level 5: A good game does not only reward points. It changes what players can do.',
  'Level 6: Difficulty can rise by reducing helpful resources, but it must stay fair.',
  'Level 7: Too much pressure can become unfair, so balance still matters.',
  'Level 8: Tradeoffs are stronger when there is no perfect move every second.',
  'Level 9: The final stretch should feel tense but possible.',
  'Level 10: A simple resource mechanic can open a serious debrief.',
];

const trainingDays = [
  'Arrival Day: find your rhythm after the trip.',
  'First Workshop: stay focused during the learning models.',
  'Team Building: keep energy without losing balance.',
  'Intercultural Evening: enjoy the group and choose wisely.',
  'Prototype Sprint: water helps more than panic.',
  'Playtest Day: clear feedback keeps you moving.',
  'Outdoor Break: good habits protect the next session.',
  'Showcase Prep: pressure is high, balance matters.',
  'Final Showcase: stay present until the end.',
  'YouthPass Reflection: finish strong and remember the lesson.',
];

const reflectionPrompts = [
  'What resource did you chase most in this level?',
  'What feedback made you change strategy?',
  'How could your prototype show consequences without lecturing?',
];

const itemMeta: Record<ItemType, {
  label: string;
  short: string;
  className: string;
  description: string;
}> = {
  water: {
    label: 'Water',
    short: 'H2O',
    className: 'border-cyan-300 bg-cyan-300/25 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,.55)]',
    description: '+life +energy +happiness',
  },
  coffee: {
    label: 'Coffee',
    short: 'CAF',
    className: 'border-yellow-300 bg-yellow-300/20 text-yellow-100 shadow-[0_0_14px_rgba(253,224,71,.45)]',
    description: '+energy +speed boost',
  },
  beer: {
    label: 'Beer',
    short: 'BEER',
    className: 'border-orange-300 bg-orange-400/20 text-orange-100 shadow-[0_0_14px_rgba(251,146,60,.45)]',
    description: '-energy, short +happiness',
  },
  wine: {
    label: 'Wine',
    short: 'WINE',
    className: 'border-red-300 bg-red-500/25 text-red-100 shadow-[0_0_16px_rgba(248,113,113,.55)]',
    description: 'big -energy, fast happiness crash',
  },
};

export default function YouthPassDropGame() {
  const { completeGame, saveGameNote, updatePrototypeField } = useStore();
  const [playerName, setPlayerName] = useState('');
  const [phase, setPhase] = useState<Phase>('name');
  const [level, setLevel] = useState(1);
  const [pieces, setPieces] = useState(0);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [playerX, setPlayerX] = useState(50);
  const [meters, setMeters] = useState<Meters>({ life: 100, energy: 70, happiness: 55 });
  const [elapsed, setElapsed] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastCatch, setLastCatch] = useState('Catch water to stay strong.');

  const phaseRef = useRef(phase);
  const levelRef = useRef(level);
  const directionRef = useRef(0);
  const boostUntilRef = useRef(0);
  const itemIdRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<number[]>([]);

  const config = useMemo(() => getLevelConfig(level), [level]);
  const progress = Math.min(100, Math.round((elapsed / config.duration) * 100));
  const displayName = playerName.trim() || 'Participant';
  const canSubmitName = playerName.trim().length >= 2;

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const playTone = useCallback((frequency: number, duration = 0.08, type: OscillatorType = 'square') => {
    if (!audioEnabled) return;
    const context = audioRef.current ?? new AudioContext();
    audioRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.076, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }, [audioEnabled]);

  const startPlaying = useCallback((nextLevel: number) => {
    setLevel(nextLevel);
    setItems([]);
    setPlayerX(50);
    setElapsed(0);
    setMeters({ life: 100, energy: 68, happiness: 55 });
    setLastCatch('Catch water. Use coffee carefully. Avoid alcohol: the short reward creates real cost.');
    setPhase('playing');
    saveGameNote(game.id, `YouthPass pieces ${Math.max(0, nextLevel - 1)}/10`);
  }, [saveGameNote]);

  const endLevel = useCallback(() => {
    const currentLevel = levelRef.current;
    const nextPieces = Math.max(pieces, currentLevel);
    setPieces(nextPieces);
    setItems([]);
    saveGameNote(game.id, `YouthPass pieces ${nextPieces}/10`);
    playTone(currentLevel >= maxLevel ? 880 : 660, 0.16, 'sine');

    if (currentLevel >= maxLevel) {
      setPhase('completed');
      completeGame(game.id, 900, game.takeaway, 'YouthPass pieces 10/10');
      return;
    }

    setPhase('level-won');
  }, [completeGame, pieces, playTone, saveGameNote]);

  const loseGame = useCallback(() => {
    setItems([]);
    setPhase('game-over');
    playTone(90, 0.35, 'sawtooth');
  }, [playTone]);

  const catchItem = useCallback((type: ItemType) => {
    const now = Date.now();
    if (type === 'water') {
      setMeters((current) => ({
        life: clamp(current.life + 24),
        energy: clamp(current.energy + 14),
        happiness: clamp(current.happiness + 10),
      }));
      setLastCatch('Water helped your life, energy, and happiness.');
      playTone(520, 0.08, 'sine');
      return;
    }

    if (type === 'coffee') {
      boostUntilRef.current = now + 2600;
      setMeters((current) => ({
        life: clamp(current.life + 2),
        energy: clamp(current.energy + 22),
        happiness: clamp(current.happiness + 3),
      }));
      setLastCatch('Coffee gave energy and speed, but water is still the safest strategy.');
      playTone(720, 0.07, 'triangle');
      return;
    }

    if (type === 'beer') {
      setMeters((current) => ({
        life: clamp(current.life - 12),
        energy: clamp(current.energy - 16),
        happiness: clamp(current.happiness + 8),
      }));
      setLastCatch('Beer gave a short positive feeling, then life and energy went down.');
      playTone(180, 0.12, 'square');
      return;
    }

    setMeters((current) => ({
      life: clamp(current.life - 22),
      energy: clamp(current.energy - 34),
      happiness: clamp(current.happiness + 34),
    }));
    setLastCatch('Wine gave a short spike, then happiness crashed.');
    playTone(120, 0.18, 'sawtooth');
    const timer = window.setTimeout(() => {
      setMeters((current) => ({ ...current, happiness: clamp(current.happiness * 0.45), life: clamp(current.life - 8) }));
    }, 850);
    timersRef.current.push(timer);
  }, [playTone]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (phaseRef.current !== 'playing' || isTypingTarget(event.target)) return;
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        event.preventDefault();
        directionRef.current = -1;
      }
      if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        directionRef.current = 1;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (phaseRef.current !== 'playing' || isTypingTarget(event.target)) return;
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) {
        directionRef.current = 0;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = window.setInterval(() => {
      const levelConfig = getLevelConfig(levelRef.current);
      const speedBoost = Date.now() < boostUntilRef.current ? 1.75 : 1;

      setPlayerX((current) => clampRange(current + directionRef.current * levelConfig.playerSpeed * speedBoost, 8, 92));
      setElapsed((current) => {
        const next = current + 0.05;
        if (next >= levelConfig.duration && phaseRef.current === 'playing') endLevel();
        return Math.min(next, levelConfig.duration);
      });
      setMeters((current) => {
        const next = {
          life: clamp(current.life - levelConfig.lifeDrain + (current.energy > 64 ? 0.035 : 0)),
          energy: clamp(current.energy - 0.055),
          happiness: clamp(current.happiness - 0.035),
        };
        if (next.life <= 0 && phaseRef.current === 'playing') loseGame();
        return next;
      });
      setItems((current) => {
        const caught: ItemType[] = [];
        const moved = current
          .map((item) => ({ ...item, y: item.y + item.speed, x: clampRange(item.x + item.drift, 4, 96) }))
          .filter((item) => {
            const playerDistance = Math.abs(item.x - playerX);
            const isCaught = item.y >= 79 && item.y <= 93 && playerDistance < 9;
            if (isCaught) {
              caught.push(item.type);
              return false;
            }
            return item.y < 104;
          });
        caught.forEach(catchItem);
        return moved;
      });
    }, 50);
    return () => window.clearInterval(interval);
  }, [catchItem, endLevel, loseGame, phase, playerX]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = window.setInterval(() => {
      const levelConfig = getLevelConfig(levelRef.current);
      setItems((current) => {
        const nextItems = [...current];
        const amount = Math.random() < levelConfig.extraDropChance ? 2 : 1;
        for (let index = 0; index < amount; index++) {
          nextItems.push(createItem(levelConfig));
        }
        return nextItems.slice(-18);
      });
    }, config.spawnMs);
    return () => window.clearInterval(interval);
  }, [config.spawnMs, phase]);

  function createItem(levelConfig: ReturnType<typeof getLevelConfig>): FallingItem {
    return {
      id: itemIdRef.current++,
      type: pickItem(levelConfig),
      x: 8 + Math.random() * 84,
      y: -8,
      speed: levelConfig.fallSpeed + Math.random() * 0.35,
      drift: (Math.random() - 0.5) * levelConfig.drift,
    };
  }

  const restartCurrent = () => startPlaying(level);
  const startNext = () => startPlaying(Math.min(level + 1, maxLevel));
  const submitName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitName) return;
    setPlayerName(playerName.trim());
    setPhase('ready');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="theme-game-screen youthpass-screen pb-10 max-w-5xl mx-auto">
      <section className="arcade-border glass-panel rounded-xl p-4 md:p-5 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">{game.subtitle}</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">{game.title}</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-2xl">
              Survive each fictional training day. Catch water, use coffee carefully, avoid alcohol, and collect all 10 YouthPass pieces.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAudioEnabled((value) => !value)}
              className="youthpass-action-button rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-cyan-400"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 inline mr-2" /> : <VolumeX className="w-4 h-4 inline mr-2" />}
              Sound
            </button>
            <button onClick={restartCurrent} className="youthpass-action-button rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-pink-400">
              <RotateCcw className="w-4 h-4 inline mr-2" /> Restart
            </button>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(280px,430px)_1fr]">
        <div className="arcade-border-pink glass-panel-pink min-w-0 rounded-xl p-3 md:p-4">
          <div className="youthpass-playfield relative mx-auto h-[620px] max-h-[72vh] min-h-[520px] w-full max-w-[390px] overflow-hidden rounded-[1.6rem] border-4 border-cyan-400/50 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.20),transparent_34%),linear-gradient(180deg,#05111f,#16051a_70%,#050507)] shadow-[0_0_28px_rgba(0,242,255,.24)]">
            <div className="youthpass-playfield-grid absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:34px_34px] opacity-50" />
            <div className="youthpass-hud absolute left-3 right-3 top-3 z-20 rounded-xl border border-white/10 bg-black/65 p-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
                <span>Level {level}/10</span>
                <span>{Math.max(0, Math.ceil(config.duration - elapsed))}s</span>
              </div>
              <p className="mt-2 text-[10px] font-bold uppercase text-cyan-200">{trainingDays[level - 1]}</p>
              <div className="youthpass-meter-track mt-2 h-2 overflow-hidden rounded-full bg-gray-900">
                <div className="h-full bg-cyan-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {items.map((item) => (
              <FallingToken key={item.id} item={item} />
            ))}

            <div
              className="absolute bottom-[6%] z-30 flex h-16 w-16 -translate-x-1/2 flex-col items-center justify-center rounded-full border-4 border-white bg-cyan-300 text-black shadow-[0_0_20px_rgba(34,211,238,.8)] transition-[left] duration-75"
              style={{ left: `${playerX}%` }}
            >
              <span className="text-[10px] font-black uppercase leading-none">{displayName.slice(0, 8)}</span>
              <span className="mt-1 h-4 w-8 rounded-b-full bg-pink-500" />
            </div>

            <div className="youthpass-floor absolute bottom-0 left-0 right-0 h-[12%] border-t border-cyan-300/30 bg-black/50" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:hidden">
            <MoveButton label="Left" onDown={() => { directionRef.current = -1; }} onUp={() => { directionRef.current = 0; }} icon={<ChevronLeft className="w-5 h-5" />} />
            <MoveButton label="Right" onDown={() => { directionRef.current = 1; }} onUp={() => { directionRef.current = 0; }} icon={<ChevronRight className="w-5 h-5" />} />
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="youthpass-pieces-panel arcade-border-green glass-panel-green min-w-0 rounded-xl p-4">
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">YouthPass Pieces</p>
            <div className="mt-4 grid min-w-0 grid-cols-10 gap-1">
              {Array.from({ length: maxLevel }).map((_, index) => (
                <div
                  key={index}
                  className={`aspect-[3/4] rounded border text-[9px] font-black flex items-center justify-center ${
                    index < pieces ? 'youthpass-piece-filled border-yellow-300 bg-yellow-300 text-black' : 'youthpass-piece-empty border-white/10 bg-black/50 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <p className="text-sm text-white font-bold mt-4">
              Rocco and Emanuel give you YouthPass piece {Math.min(pieces + 1, 10)}/10 if you survive this level.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            <Meter label="Life" value={meters.life} color="bg-green-400" />
            <Meter label="Energy" value={meters.energy} color="bg-cyan-300" />
            <Meter label="Happiness" value={meters.happiness} color="bg-pink-400" />
          </div>

          <div className="youthpass-info-panel bg-black/60 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Last Feedback</p>
            <p className="text-sm text-gray-200 leading-relaxed mt-3">{lastCatch}</p>
          </div>

          <div className="youthpass-info-panel bg-black/60 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Design Note</p>
            <p className="text-sm text-gray-300 leading-relaxed mt-3">{designNotes[level - 1]}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(itemMeta) as ItemType[]).map((type) => (
              <div key={type} className="youthpass-item-card rounded-lg border border-white/10 bg-black/45 p-3">
                <p className="text-xs font-black text-white">{itemMeta[type].label}</p>
                <p className="text-[10px] text-gray-400 mt-1">{itemMeta[type].description}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {phase === 'name' && (
        <Overlay title="Who Is Playing?" tone="cyan">
          <form onSubmit={submitName} className="space-y-5">
            <p className="text-sm text-gray-300 leading-relaxed">Write your name. Your participant will try to reach YouthPass with water, energy, and smart choices.</p>
            <label className="block text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Player name</span>
              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                maxLength={18}
                autoFocus
                inputMode="text"
                autoComplete="given-name"
                enterKeyHint="done"
                className="youthpass-name-input mt-2 w-full rounded-xl border-2 border-cyan-400/50 bg-black/80 px-4 py-4 text-center font-sans text-lg font-bold tracking-normal text-white caret-cyan-300 outline-none focus:border-cyan-200 focus:ring-4 focus:ring-cyan-300/20"
                placeholder="Your name"
              />
            </label>
            <button
              type="submit"
              disabled={!canSubmitName}
              className={`arcade-border px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                canSubmitName
                  ? 'bg-cyan-900/40 text-cyan-200 hover:bg-cyan-400 hover:text-black'
                  : 'cursor-not-allowed bg-gray-900/70 text-gray-600 opacity-70'
              }`}
            >
              Continue
            </button>
            <p className="text-[10px] font-bold uppercase text-gray-500">Use at least 2 characters. Press Enter to continue.</p>
          </form>
        </Overlay>
      )}

      {phase === 'ready' && (
        <Overlay title="Rocco Briefing" tone="green">
          <p className="text-lg text-white font-black leading-relaxed">Stay hydrated. Coffee can help. Alcohol makes the level harder.</p>
          <p className="text-sm text-gray-300 mt-4">Move left and right. Survive until the timer ends to receive a YouthPass piece.</p>
          <button onClick={() => startPlaying(1)} className="mt-6 arcade-border-green px-6 py-3 bg-green-900/40 text-green-200 text-xs font-bold uppercase tracking-widest hover:bg-green-400 hover:text-black">
            Start Level 1
          </button>
        </Overlay>
      )}

      {phase === 'level-won' && (
        <Overlay title="YouthPass Piece Unlocked" tone="green">
          <Trophy className="w-10 h-10 text-yellow-300 mx-auto" />
          <p className="text-lg text-white font-black mt-4">Rocco and Emanuel give you YouthPass piece {pieces}/10 for Games Are No Joke.</p>
          <p className="text-sm text-gray-300 mt-4">{designNotes[level - 1]}</p>
          <div className="mt-5 grid grid-cols-1 gap-2 text-left">
            {reflectionPrompts.map((prompt) => (
              <div key={prompt} className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm font-bold text-cyan-100">{prompt}</div>
            ))}
          </div>
          <button onClick={startNext} className="mt-6 arcade-border-green px-6 py-3 bg-green-900/40 text-green-200 text-xs font-bold uppercase tracking-widest hover:bg-green-400 hover:text-black">
            Next Level
          </button>
        </Overlay>
      )}

      {phase === 'game-over' && (
        <Overlay title="Game Over" tone="red">
          <p className="text-lg text-white font-black">Rocco and Emanuel say: Drink more water and less alcohol. Try again!</p>
          <p className="text-sm text-gray-300 mt-4">The system gave feedback through meters. That makes consequences visible to the player.</p>
          <button onClick={restartCurrent} className="mt-6 border-2 border-red-400 px-6 py-3 text-red-200 text-xs font-bold uppercase tracking-widest hover:bg-red-400 hover:text-black">
            Retry Level {level}
          </button>
        </Overlay>
      )}

      {phase === 'completed' && (
        <Overlay title="YouthPass Complete" tone="green">
          <Trophy className="w-12 h-12 text-yellow-300 mx-auto" />
          <p className="text-lg text-white font-black mt-4">Rocco and Emanuel give you the full YouthPass certificate for Games Are No Joke.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-left">
            {['Water was the best strategy.', 'Alcohol created short reward and real cost.', 'Meters made consequences readable.', 'Balance created a debrief topic.'].map((line) => (
              <div key={line} className="rounded-lg border border-green-400/30 bg-green-400/10 p-3 text-sm text-green-100 font-bold">{line}</div>
            ))}
          </div>
          <button
            onClick={() => updatePrototypeField('debriefQuestion', game.prototypePrompt)}
            className="mt-6 arcade-border-green px-6 py-3 bg-green-900/40 text-green-200 text-xs font-bold uppercase tracking-widest hover:bg-green-400 hover:text-black"
          >
            Send Takeaway to Prototype Lab
          </button>
        </Overlay>
      )}
    </motion.div>
  );
}

function FallingToken({ item }: { key?: number; item: FallingItem }) {
  const meta = itemMeta[item.type];
  const Icon = item.type === 'water' ? Droplets : item.type === 'coffee' ? Coffee : item.type === 'beer' ? Beer : Wine;
  return (
    <div
      className={`absolute z-20 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-2xl border-2 text-[10px] font-black ${meta.className}`}
      style={{ left: `${item.x}%`, top: `${item.y}%` }}
      title={meta.label}
    >
      <Icon className="w-6 h-6" />
    </div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="youthpass-meter rounded-xl border border-white/10 bg-black/60 p-4">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
        <span>{label}</span>
        <span className="text-white">{Math.round(value)}%</span>
      </div>
      <div className="youthpass-meter-track mt-3 h-3 overflow-hidden rounded-full bg-gray-900">
        <div className={`h-full ${color} ${value < 24 ? 'animate-pulse' : ''}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MoveButton({ label, icon, onDown, onUp }: { label: string; icon: ReactNode; onDown: () => void; onUp: () => void }) {
  return (
    <button
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      className="youthpass-move-button h-14 rounded-xl border border-cyan-400/50 bg-cyan-400/10 text-xs font-bold uppercase text-cyan-100 active:bg-cyan-400 active:text-black flex items-center justify-center gap-2"
    >
      {icon}
      {label}
    </button>
  );
}

function Overlay({ title, tone, children }: { title: string; tone: 'cyan' | 'green' | 'red'; children: ReactNode }) {
  const toneClass = tone === 'green'
    ? 'arcade-border-green'
    : tone === 'red'
      ? 'border-2 border-red-400 shadow-[0_0_16px_rgba(248,113,113,.45)]'
      : 'arcade-border';
  return (
    <div className="youthpass-overlay fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`youthpass-overlay-panel ${toneClass} bg-black/90 rounded-xl p-6 max-w-xl w-full text-center`}>
        <h2 className="text-2xl font-arcade text-white">{title}</h2>
        <div className="mt-5">{children}</div>
      </motion.div>
    </div>
  );
}

function getLevelConfig(level: number) {
  return {
    duration: 23 + level * 2,
    spawnMs: Math.max(420, 980 - level * 55),
    fallSpeed: 0.68 + level * 0.08,
    playerSpeed: 2.5 + Math.min(level, 5) * 0.08,
    lifeDrain: 0.085 + level * 0.011,
    drift: 0.08 + level * 0.025,
    extraDropChance: Math.min(0.42, level * 0.035),
    waterChance: Math.max(0.23, 0.48 - level * 0.025),
    coffeeChance: Math.max(0.11, 0.2 - level * 0.008),
    beerChance: Math.min(0.39, 0.22 + level * 0.018),
  };
}

function pickItem(config: ReturnType<typeof getLevelConfig>): ItemType {
  const roll = Math.random();
  if (roll < config.waterChance) return 'water';
  if (roll < config.waterChance + config.coffeeChance) return 'coffee';
  if (roll < config.waterChance + config.coffeeChance + config.beerChance) return 'beer';
  return 'wine';
}

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
}

function clamp(value: number) {
  return clampRange(value, 0, 100);
}

function clampRange(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
