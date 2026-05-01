import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Compass,
  Download,
  Eye,
  Gauge,
  Handshake,
  Layers3,
  Lightbulb,
  MessageCircleQuestion,
  PenTool,
  PlayCircle,
  Printer,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  ToggleLeft,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { courseInfo, lessons } from '../data/course';
import { useStore } from '../store/useStore';

const courseLogoPath = `${import.meta.env.BASE_URL}arte-diem-course-logos.png`;
const erasmusLogoPath = `${import.meta.env.BASE_URL}erasmus-plus-small.png`;

type Lesson = typeof lessons[number];
type TheoryCard = Lesson['cardDeck'][number];
type TheoryControl = {
  id: string;
  label: string;
  kind: 'slider' | 'switch' | 'knob';
  min?: number;
  max?: number;
  defaultValue: number | boolean;
};
type InteractiveLab = {
  title: string;
  intro: string;
  controls: TheoryControl[];
};
type InteractiveValue = number | boolean;
type PdfDocument = InstanceType<typeof import('jspdf').jsPDF>;

export default function Theory() {
  const { completedLessons, completeLesson, saveQuizScore, appTheme } = useStore();
  const [activeLessonId, setActiveLessonId] = useState(lessons[0].id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const activeLesson = lessons.find((lesson) => lesson.id === activeLessonId) ?? lessons[0];
  const selectedAnswer = answers[activeLesson.id];
  const isCorrect = selectedAnswer === activeLesson.checkpoint.answer;
  const isDone = completedLessons.includes(activeLesson.id);
  const progressPercent = Math.round((completedLessons.length / lessons.length) * 100);
  const activeCard = activeLesson.cardDeck[activeCardIndex] ?? activeLesson.cardDeck[0];
  const activeCardKey = `${activeLesson.id}-${activeCardIndex}`;
  const isCardBack = Boolean(flippedCards[activeCardKey]);
  const LessonIcon = activeLesson.icon;

  useEffect(() => {
    setActiveCardIndex(0);
  }, [activeLesson.id]);

  const visibleSources = useMemo(() => activeLesson.sources.slice(0, 4), [activeLesson.sources]);

  const completeActiveLesson = () => {
    completeLesson(activeLesson.id, isCorrect ? 35 : 20);
    saveQuizScore(`lesson-${activeLesson.id}`, isCorrect ? 10 : 5);
  };

  const moveCard = (direction: -1 | 1) => {
    setActiveCardIndex((current) => (current + direction + activeLesson.cardDeck.length) % activeLesson.cardDeck.length);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-4 pb-10 lg:grid-cols-12">
      <TheorySidebar
        activeLessonId={activeLesson.id}
        completedLessons={completedLessons}
        progressPercent={progressPercent}
        onSelect={setActiveLessonId}
      />

      <main className="lg:col-span-8 space-y-4">
        <section className="arcade-border-pink glass-panel-pink rounded-xl p-4 md:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-pink-300">{activeLesson.modelTag}</p>
              <h1 className="mt-3 text-2xl font-arcade leading-tight text-white md:text-3xl">{activeLesson.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-200">{activeLesson.focus}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <LessonIcon className="h-8 w-8 text-pink-300" />
              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Learning model</p>
              <p className="mt-2 text-sm font-black leading-snug text-white">{activeLesson.model}</p>
              {isDone && <p className="mt-3 rounded-lg bg-green-300/15 px-3 py-2 text-[10px] font-black uppercase text-green-200">{activeLesson.rewardBadge}</p>}
              <button
                onClick={() => void downloadLessonModule(activeLesson)}
                className="theory-action-button mt-4 w-full"
              >
                <Download className="h-3.5 w-3.5" /> Download Module
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/35 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <InfoBlock label="Definition" text={activeLesson.definition} />
            <InfoBlock label="Why it matters" text={activeLesson.whyItMatters} />
            <InfoBlock label="Board-game pattern" text={activeLesson.boardGamePattern} />
          </div>
        </section>

        <ModelDeck lesson={activeLesson} />

        <TheoryInteractiveLab lesson={activeLesson} />

        <section className="rounded-xl border border-white/10 bg-black/45 p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-arcade text-yellow-300">
                <Layers3 className="h-5 w-5" /> Printable Card Deck
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                One focused card at a time. Flip it, discuss it, print it, or use it during prototype work.
              </p>
            </div>
            <PrintableDeckActions lesson={activeLesson} />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <CarouselButton label="Previous theory card" onClick={() => moveCard(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </CarouselButton>

            <button
              onClick={() => setFlippedCards((current) => ({ ...current, [activeCardKey]: !current[activeCardKey] }))}
              className="group min-w-0 flex-1 text-left [perspective:1200px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              aria-pressed={isCardBack}
            >
              <TheoryCardFace card={activeCard} index={activeCardIndex} total={activeLesson.cardDeck.length} isBack={isCardBack} />
            </button>

            <CarouselButton label="Next theory card" onClick={() => moveCard(1)}>
              <ChevronRight className="h-5 w-5" />
            </CarouselButton>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {activeLesson.cardDeck.map((card, index) => (
              <button
                key={`${card.front}-${index}`}
                onClick={() => setActiveCardIndex(index)}
                className={`h-2.5 rounded-full transition-all ${index === activeCardIndex ? 'w-9 bg-yellow-300' : 'w-2.5 bg-white/25 hover:bg-white/50'}`}
                aria-label={`Open theory card ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <ModuleDeepDive lesson={activeLesson} sources={visibleSources} />

        <QuickCheckPanel
          lesson={activeLesson}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
          onAnswer={(index) => setAnswers((current) => ({ ...current, [activeLesson.id]: index }))}
        />

        <section className="rounded-xl border border-green-300/30 bg-green-300/10 p-4">
          <h3 className="flex items-center gap-2 text-sm font-arcade text-green-300">
            <Eye className="h-5 w-5" /> Try It Now
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-200">{activeLesson.tryIt}</p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            {appTheme === 'notebook' ? 'Readable notebook mode active.' : 'Arcade mode active.'} Content is written in Simple English for training use.
          </p>
          <button
            onClick={completeActiveLesson}
            disabled={selectedAnswer === undefined}
            className="arcade-border px-5 py-3 text-xs font-bold uppercase tracking-widest text-cyan-200 transition-colors hover:bg-cyan-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trophy className="mr-2 inline h-4 w-4" />
            {isDone ? 'Badge Saved' : 'Save Badge'}
          </button>
        </div>
      </main>
    </motion.div>
  );
}

function TheorySidebar({
  activeLessonId,
  completedLessons,
  progressPercent,
  onSelect,
}: {
  activeLessonId: string;
  completedLessons: string[];
  progressPercent: number;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="theory-sidebar notebook-sidebar-frame notebook-surface arcade-border glass-panel rounded-xl p-4 lg:col-span-4 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-arcade text-cyan-400">Theory Path</h2>
          <p className="mt-2 text-xs leading-relaxed text-gray-400">Learn models. Flip cards. Use prompts during group work.</p>
        </div>
        <span className="notebook-chip rounded-lg border border-cyan-300/30 bg-black/50 px-3 py-2 text-xs font-black text-white">
          {completedLessons.length}/{lessons.length}
        </span>
      </div>

      <div className="notebook-muted-card mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
          <span>Learning rewards</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-900">
          <div className="h-full bg-cyan-300 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <nav className="mt-4 space-y-2" aria-label="Theory modules">
        {lessons.map((lesson, index) => {
          const done = completedLessons.includes(lesson.id);
          const isActive = lesson.id === activeLessonId;
          return (
            <button
              key={lesson.id}
              onClick={() => onSelect(lesson.id)}
              data-active={isActive}
              className={`notebook-list-button w-full rounded-xl border p-3 text-left transition-colors ${
                isActive ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-black/35 hover:border-cyan-300/50'
              }`}
            >
              <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
                {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-400" /> : <Circle className="mt-0.5 h-5 w-5 text-gray-500" />}
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Module {index + 1}/{lessons.length}</p>
                  <p className="mt-1 text-sm font-black leading-snug text-white">{lesson.title}</p>
                  {done && <p className="mt-1 text-[10px] font-black uppercase text-green-300">{lesson.rewardBadge}</p>}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[.04] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{label}</p>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-gray-100">{text}</p>
    </article>
  );
}

function ModelDeck({ lesson }: { lesson: Lesson }) {
  const [activeStep, setActiveStep] = useState(0);
  const selectedStep = lesson.modelSteps[activeStep] ?? lesson.modelSteps[0];
  const selectedLens = lesson.boardGameLens[activeStep % lesson.boardGameLens.length];

  useEffect(() => {
    setActiveStep(0);
  }, [lesson.id]);

  return (
    <section className="rounded-xl border border-white/10 bg-black/40 p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-arcade text-cyan-300">
            <Sparkles className="h-5 w-5" /> Model Cards
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">Tap one card. Use the trainer note below to guide the group.</p>
        </div>
      </div>

      <div className="mt-4 -mx-2 flex gap-3 overflow-x-auto px-2 pb-3 pt-1 sm:-mx-3 sm:px-3">
        {lesson.modelSteps.map((step, index) => (
          <button
            key={step.label}
            onClick={() => setActiveStep(index)}
            className={`no-hover-lift grid min-h-[9rem] w-[16.75rem] shrink-0 grid-rows-[auto_1fr] rounded-xl border p-4 text-left transition-colors sm:w-[17.5rem] md:p-5 ${
              activeStep === index ? 'border-cyan-300 bg-cyan-300/15' : 'border-white/10 bg-white/[.04] hover:border-cyan-300/50'
            }`}
          >
            <div className="grid grid-cols-[2.4rem_minmax(0,1fr)] items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300 text-sm font-black text-black">{index + 1}</span>
              <h3 className="text-base font-black leading-tight text-white">{step.label}</h3>
            </div>
            <p className="mt-4 text-sm font-bold leading-relaxed text-gray-300">{step.prompt}</p>
          </button>
        ))}
      </div>

      <article className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-200">Trainer note: {selectedStep.label}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <DetailTile label="What it means" text={selectedStep.text} />
          <DetailTile label="Board-game use" text={selectedLens} />
          <DetailTile label="Facilitator question" text={selectedStep.prompt} strong />
          <DetailTile label="Prototype task" text="Put this model on the table. Change one rule, card, token, or role so the group can test the idea in one short round." />
        </div>
      </article>
    </section>
  );
}

function TheoryCardFace({ card, index, total, isBack }: { card: TheoryCard; index: number; total: number; isBack: boolean }) {
  const CardIcon = getCardIcon(card.category);
  return (
    <div className={`relative h-[24rem] w-full transition-transform duration-700 [transform-style:preserve-3d] ${isBack ? '[transform:rotateY(180deg)]' : ''}`}>
      <article className="theory-flip-face theory-flip-front absolute inset-0 p-5 text-center [backface-visibility:hidden] md:p-6">
        <div className="flex h-full flex-col items-center justify-center">
          <div className="theory-icon mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
            <CardIcon className="h-8 w-8" />
          </div>
          <p className="theory-muted text-[10px] font-black uppercase tracking-widest">Front {index + 1}/{total} - {card.category}</p>
          <h3 className="mt-5 max-w-xl text-3xl font-black leading-tight md:text-4xl">{card.front}</h3>
          <p className="theory-copy mt-5 max-w-xl text-base font-semibold leading-relaxed">{card.frontHint}</p>
          <span className="theory-pill mt-7">
            Tap to flip
          </span>
        </div>
      </article>

      <article className="theory-flip-face theory-flip-back absolute inset-0 p-5 [backface-visibility:hidden] [transform:rotateY(180deg)] md:p-6">
        <div className="flex h-full flex-col">
          <div className="theory-divider flex items-center justify-between gap-3 pb-3">
            <div className="min-w-0">
              <p className="theory-muted text-[10px] font-black uppercase tracking-widest">Back {index + 1}/{total}</p>
              <h3 className="mt-1 truncate text-lg font-black">{card.front}</h3>
            </div>
            <span className="theory-pill">
              Reflection
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-1">
            <p className="theory-copy text-sm font-semibold leading-relaxed">{card.back}</p>
          </div>

          <div className="theory-card-muted p-4">
            <p className="theory-muted text-[10px] font-black uppercase tracking-widest">Prototype prompt</p>
            <p className="mt-2 text-sm font-bold leading-relaxed">{card.prompt}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

function TheoryInteractiveLab({ lesson }: { lesson: Lesson }) {
  const lab = useMemo<InteractiveLab>(() => (lesson.interactiveLab as InteractiveLab | undefined) ?? buildDefaultLab(lesson), [lesson]);
  const [values, setValues] = useState<Record<string, InteractiveValue>>(() => initialLabValues(lab));

  useEffect(() => {
    setValues(initialLabValues(lab));
  }, [lab]);

  const setValue = (id: string, value: InteractiveValue) => {
    setValues((current) => ({ ...current, [id]: value }));
  };

  const sliders = lab.controls.filter((control) => control.kind === 'slider');
  const knobs = lab.controls.filter((control) => control.kind === 'knob');
  const switches = lab.controls.filter((control) => control.kind === 'switch');
  const insight = getInteractiveInsight(lesson, values);
  const result = getTunerResult(values);

  return (
    <section className="theory-surface p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-arcade">
            <SlidersHorizontal className="h-5 w-5" /> {lab.title}
          </h2>
          <p className="theory-copy mt-2 text-sm leading-relaxed">{lab.intro}</p>
        </div>
        <span className="theory-pill">
          Tune the model
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="grid grid-cols-1 gap-3">
          {sliders.map((control) => (
            <div key={control.id}>
              <SliderControl control={control} value={Number(values[control.id] ?? control.defaultValue)} onChange={(value) => setValue(control.id, value)} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {knobs.map((control) => (
            <div key={control.id}>
              <KnobControl control={control} value={Number(values[control.id] ?? control.defaultValue)} onChange={(value) => setValue(control.id, value)} />
            </div>
          ))}
          {switches.length > 0 && (
            <div className="theory-control">
              <p className="theory-muted mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <ToggleLeft className="h-4 w-4" /> Safety checks
              </p>
              <div className="grid grid-cols-1 gap-2">
                {switches.map((control) => (
                  <div key={control.id}>
                    <SwitchControl control={control} value={Boolean(values[control.id])} onChange={(value) => setValue(control.id, value)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <TunerResultPanel result={result} />

      <div className="theory-insight mt-4 p-4">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <Lightbulb className="h-4 w-4" /> Design insight
        </p>
        <p className="mt-2 text-sm font-bold leading-relaxed">{insight}</p>
      </div>
    </section>
  );
}

function SliderControl({ control, value, onChange }: { control: TheoryControl; value: number; onChange: (value: number) => void }) {
  return (
    <label className="theory-control block">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black">{control.label}</span>
        <span className="theory-pill">{value}/10</span>
      </div>
      <input
        type="range"
        min={control.min ?? 0}
        max={control.max ?? 10}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="theory-range mt-4 w-full"
      />
      <ControlMeaning control={control} value={value} />
    </label>
  );
}

function KnobControl({ control, value, onChange }: { control: TheoryControl; value: number; onChange: (value: number) => void }) {
  const min = control.min ?? 0;
  const max = control.max ?? 10;
  const percent = ((value - min) / (max - min)) * 100;
  const feedback = getControlFeedback(control.id, value);
  return (
    <label className="theory-control block">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="flex items-center gap-2 text-sm font-black">
            <Gauge className="h-4 w-4" /> {control.label}
          </span>
          <p className="theory-copy mt-2 text-xs font-semibold leading-relaxed">{feedback.text}</p>
        </div>
        <div className="theory-mini-ring" style={{ '--ring-progress': `${percent}%` } as CSSProperties}>
          <span>{value}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="theory-range mt-4 w-full"
      />
    </label>
  );
}

function ControlMeaning({ control, value }: { control: TheoryControl; value: number }) {
  const feedback = getControlFeedback(control.id, value);
  return (
    <div className="mt-3 grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3">
      <span className="theory-muted text-[10px] font-black uppercase tracking-widest">{feedback.level}</span>
      <p className="theory-copy text-xs font-semibold leading-relaxed">{feedback.text}</p>
    </div>
  );
}

function SwitchControl({ control, value, onChange }: { control: TheoryControl; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`theory-switch ${value ? 'theory-switch-on' : ''}`}
    >
      <span className="text-xs font-black uppercase">{control.label}</span>
      <span className="ml-auto text-[10px] font-black uppercase">{value ? 'On' : 'Off'}</span>
      <span className="theory-switch-track">
        <span className="theory-switch-thumb" />
      </span>
    </button>
  );
}

function initialLabValues(lab: InteractiveLab) {
  return Object.fromEntries(lab.controls.map((control) => [control.id, control.defaultValue])) as Record<string, InteractiveValue>;
}

function TunerResultPanel({ result }: { result: ReturnType<typeof getTunerResult> }) {
  return (
    <div className="theory-card-muted mt-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="theory-muted text-[10px] font-black uppercase tracking-widest">Live model result</p>
          <h3 className="mt-1 text-base font-black">{result.title}</h3>
          <p className="theory-copy mt-1 text-sm font-semibold leading-relaxed">{result.text}</p>
        </div>
        <div className="grid min-w-44 grid-cols-3 gap-2">
          {result.meters.map((meter) => (
            <div key={meter.label} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-current text-xs font-black" style={{ color: meter.color }}>
                {meter.value}
              </div>
              <p className="theory-muted mt-1 text-[9px] font-black uppercase">{meter.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildDefaultLab(lesson: Lesson): InteractiveLab {
  return {
    title: `${lesson.title} Tuner`,
    intro: 'Adjust the model and notice what your prototype may need next.',
    controls: [
      { id: 'challenge', label: 'Challenge', kind: 'slider', min: 0, max: 10, defaultValue: 5 },
      { id: 'safety', label: 'Safety', kind: 'slider', min: 0, max: 10, defaultValue: 7 },
      { id: 'freedom', label: 'Freedom', kind: 'slider', min: 0, max: 10, defaultValue: 5 },
      { id: 'feedback', label: 'Feedback', kind: 'slider', min: 0, max: 10, defaultValue: 6 },
      { id: 'reflectionDepth', label: 'Reflection Depth', kind: 'knob', min: 0, max: 10, defaultValue: 6 },
      { id: 'clearGoal', label: 'Clear Goal', kind: 'switch', defaultValue: true },
      { id: 'debriefIncluded', label: 'Debrief Included', kind: 'switch', defaultValue: true },
      { id: 'rolesRespectful', label: 'Roles Are Respectful', kind: 'switch', defaultValue: true },
    ],
  };
}

function getInteractiveInsight(lesson: Lesson, values: Record<string, InteractiveValue>) {
  const safety = Number(values.safety ?? 7);
  const challenge = Number(values.challenge ?? 5);
  const feedback = Number(values.feedback ?? 6);
  const freedom = Number(values.freedom ?? values.fictionalDistance ?? 5);
  const reflection = Number(values.reflectionDepth ?? values.debriefDepth ?? 6);
  const checks = Object.entries(values).filter(([, value]) => typeof value === 'boolean');
  const missingChecks = checks.filter(([, value]) => !value).map(([key]) => readableControlName(key));

  if (safety <= 3 && challenge >= 7) return 'This may feel risky. Add clearer boundaries, consent, or an opt-out before increasing challenge.';
  if (reflection <= 3 || values.reflection === false || values.debriefIncluded === false) return 'The game may be fun, but learning may stay hidden. Add an exit question or short debrief.';
  if (missingChecks.length > 0) return `One protection is missing: ${missingChecks.join(', ')}. Add it before using this with a group.`;
  if (feedback <= 3 && challenge >= 6) return 'Players may face difficulty without understanding why. Add tokens, signs, reactions, or visible progress.';
  if (freedom >= 8 && feedback <= 5) return 'Players have many choices, but they may not see consequences. Add clearer feedback after each action.';
  if (safety >= 9 && challenge >= 9) return 'High safety and high challenge can work well. Make the challenge fair, optional when needed, and easy to debrief.';
  if (lesson.id === 'magic-circle' && safety >= 6 && challenge >= 4 && reflection >= 6) return 'This circle is ready for a safe youth-work prototype. Now test if players understand how to enter and exit.';
  if (challenge <= 2) return 'The experience may feel too flat. Add a fair obstacle, timer, scarce resource, or meaningful tradeoff.';
  return 'This balance looks usable. Playtest one short round and watch if players feel safe, active, and ready to reflect.';
}

function getTunerResult(values: Record<string, InteractiveValue>) {
  const challenge = Number(values.challenge ?? 5);
  const safety = Number(values.safety ?? 7);
  const freedom = Number(values.freedom ?? values.fictionalDistance ?? 5);
  const feedback = Number(values.feedback ?? 6);
  const reflection = Number(values.reflectionDepth ?? values.debriefDepth ?? 6);
  const clarityChecks = Object.entries(values).filter(([, value]) => typeof value === 'boolean');
  const activeChecks = clarityChecks.filter(([, value]) => value).length;
  const clarity = clarityChecks.length > 0 ? Math.round((activeChecks / clarityChecks.length) * 10) : 8;
  const learningPower = Math.round((feedback + reflection + clarity) / 3);
  const comfort = Math.round((safety + clarity + Math.max(0, 10 - Math.max(0, challenge - safety))) / 3);
  const agency = Math.round((freedom + feedback + Math.max(0, 10 - Math.abs(challenge - 6))) / 3);

  if (comfort <= 4) {
    return {
      title: 'Risky game frame',
      text: 'The experience may create tension before enough safety is visible. Lower pressure or add a clearer protection rule.',
      meters: buildMeters(comfort, agency, learningPower),
    };
  }
  if (learningPower <= 4) {
    return {
      title: 'Fun, but learning is hidden',
      text: 'Players may enjoy the activity, but they need stronger feedback and reflection to understand the lesson.',
      meters: buildMeters(comfort, agency, learningPower),
    };
  }
  if (agency <= 4) {
    return {
      title: 'Too controlled',
      text: 'The frame is safe, but players need more meaningful choices or clearer consequences.',
      meters: buildMeters(comfort, agency, learningPower),
    };
  }
  if (challenge >= 8 && safety >= 8 && learningPower >= 7) {
    return {
      title: 'Strong learning challenge',
      text: 'This setup can create useful tension because safety, feedback, and reflection are also strong.',
      meters: buildMeters(comfort, agency, learningPower),
    };
  }
  return {
    title: 'Balanced prototype setup',
    text: 'This model has enough safety, choice, and learning feedback to test with a small group.',
    meters: buildMeters(comfort, agency, learningPower),
  };
}

function buildMeters(comfort: number, agency: number, learningPower: number) {
  return [
    { label: 'Safety', value: comfort, color: 'var(--theory-accent)' },
    { label: 'Agency', value: agency, color: 'var(--theory-accent)' },
    { label: 'Learning', value: learningPower, color: 'var(--theory-accent)' },
  ];
}

function getControlFeedback(id: string, value: number) {
  const level = value <= 3 ? 'Low' : value >= 8 ? 'High' : 'Medium';
  const feedback: Record<string, Record<string, string>> = {
    challenge: {
      Low: 'Players may not feel a real problem to solve. Add a fair obstacle or tradeoff.',
      Medium: 'The task has enough difficulty to create attention without blocking the group.',
      High: 'Pressure is strong. Keep routes, rules, and recovery spaces very clear.',
    },
    safety: {
      Low: 'Participants may feel exposed. Add consent, opt-out, or fictional distance.',
      Medium: 'The frame is usable, but name the boundaries before play starts.',
      High: 'The group has a protected space. You can ask for deeper reflection.',
    },
    freedom: {
      Low: 'Players may feel they are only following instructions. Add one real choice.',
      Medium: 'Players have useful choices without too many possibilities.',
      High: 'Players have many options. Make consequences visible so it does not feel random.',
    },
    feedback: {
      Low: 'Players may not see what changed. Add tokens, meters, cards, or reactions.',
      Medium: 'Players receive enough signals to adjust their next action.',
      High: 'The system answers clearly. Use this feedback in the debrief.',
    },
    fictionalDistance: {
      Low: 'The topic may feel very personal. Consider a village, mission, or fictional role.',
      Medium: 'The frame gives distance while keeping the topic recognizable.',
      High: 'The fiction protects the group. Make sure the real-life connection returns in debrief.',
    },
    reflectionDepth: {
      Low: 'Learning may stay invisible. Add one observation and one transfer question.',
      Medium: 'The debrief can connect play to youth work without becoming too long.',
      High: 'Reflection is deep. Keep it safe and start from what happened in the game.',
    },
    debriefDepth: {
      Low: 'Learning may stay invisible. Add one observation and one transfer question.',
      Medium: 'The debrief can connect play to youth work without becoming too long.',
      High: 'Reflection is deep. Keep it safe and start from what happened in the game.',
    },
  };

  return { level, text: feedback[id]?.[level] ?? 'This value changes how the prototype feels during play.' };
}

function readableControlName(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function getCardIcon(category: string): LucideIcon {
  if (category.includes('Definition')) return Compass;
  if (category.includes('Design')) return SquarePen;
  if (category.includes('Youth')) return Handshake;
  if (category.includes('Facilitator')) return ShieldCheck;
  if (category.includes('Prototype')) return PenTool;
  if (category.includes('Debrief')) return MessageCircleQuestion;
  return Sparkles;
}

function CarouselButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/45 text-gray-200 hover:border-yellow-300"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function PrintableDeckActions({ lesson }: { lesson: Lesson }) {
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[13rem]">
      <button onClick={() => printLessonCards(lesson)} className="theory-action-button">
        <Printer className="h-3.5 w-3.5" /> Print
      </button>
      <button onClick={() => void downloadLessonCards(lesson)} className="theory-action-button">
        <Download className="h-3.5 w-3.5" /> Download
      </button>
    </div>
  );
}

function ModuleDeepDive({ lesson, sources }: { lesson: Lesson; sources: string[] }) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Panel title="Youth-work lens" tone="green">
        <p>{lesson.youthWorkLens}</p>
        <p className="mt-3 text-[10px] font-black uppercase tracking-widest">Facilitator move</p>
        <p className="mt-1">{lesson.facilitatorMove}</p>
      </Panel>
      <Panel title="Prototype meaning" tone="cyan">
        <p>{lesson.tryIt}</p>
        <p className="mt-3 text-[10px] font-black uppercase tracking-widest">Common mistake</p>
        <p className="mt-1">{lesson.antiPattern}</p>
      </Panel>
      <Panel title="Mini example" tone="yellow">
        <p>{lesson.example}</p>
      </Panel>
      <Panel title="Trainer backup" tone="pink">
        <p>{lesson.trainerBackup}</p>
        <ul className="mt-3 space-y-2">
          {sources.map((source) => (
            <li key={source} className="flex gap-2 text-xs leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              <span>{source}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </section>
  );
}

function Panel({ title, tone, children }: { title: string; tone: 'green' | 'cyan' | 'yellow' | 'pink'; children: ReactNode }) {
  const toneClass = {
    green: 'border-green-300/30 bg-green-300/10 text-green-200',
    cyan: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200',
    yellow: 'border-yellow-300/30 bg-yellow-300/10 text-yellow-100',
    pink: 'border-pink-300/30 bg-pink-300/10 text-pink-100',
  }[tone];
  return (
    <article className={`rounded-xl border p-4 text-sm leading-relaxed ${toneClass}`}>
      <h3 className="text-sm font-arcade">{title}</h3>
      <div className="mt-3 text-gray-100">{children}</div>
    </article>
  );
}

function DetailTile({ label, text, strong = false }: { label: string; text: string; strong?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
      <p className={`mt-2 text-sm leading-relaxed ${strong ? 'font-black text-cyan-100' : 'text-gray-100'}`}>{text}</p>
    </div>
  );
}

function QuickCheckPanel({
  lesson,
  selectedAnswer,
  isCorrect,
  onAnswer,
}: {
  lesson: Lesson;
  selectedAnswer: number | undefined;
  isCorrect: boolean;
  onAnswer: (index: number) => void;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-black/55 p-4">
      <h3 className="flex items-center gap-2 text-sm font-arcade text-white">
        <PlayCircle className="h-5 w-5 text-pink-400" /> Quick Check
      </h3>
      <p className="mt-3 text-sm text-gray-300">{lesson.checkpoint.question}</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {lesson.checkpoint.options.map((option, index) => (
          <button
            key={option}
            onClick={() => onAnswer(index)}
            className={`rounded-lg border px-3 py-3 text-sm font-bold transition-colors ${
              selectedAnswer === index
                ? index === lesson.checkpoint.answer
                  ? 'border-green-400 bg-green-400/20 text-green-100'
                  : 'border-red-400 bg-red-400/20 text-red-100'
                : 'border-white/10 bg-white/5 text-gray-200 hover:border-cyan-400/60'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {selectedAnswer !== undefined && (
        <p className={`mt-3 text-sm font-bold ${isCorrect ? 'text-green-300' : 'text-yellow-300'}`}>
          {isCorrect ? 'Good. You unlocked the model idea.' : 'Almost. Choose the answer that protects active learning and reflection.'}
        </p>
      )}
    </section>
  );
}

async function downloadLessonCards(lesson: Lesson) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const [erasmusLogo, courseLogo] = await Promise.all([
    imageToDataUrl(erasmusLogoPath),
    imageToDataUrl(courseLogoPath),
  ]);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const headerHeight = 34;
  const cardGap = 8;
  const cardHeight = (pageHeight - margin * 2 - headerHeight - cardGap) / 2;
  const cardWidth = pageWidth - margin * 2;

  lesson.cardDeck.forEach((card, index) => {
    if (index > 0 && index % 2 === 0) pdf.addPage();
    if (index % 2 === 0) drawPdfHeader(pdf, lesson, erasmusLogo, courseLogo);
    const y = margin + headerHeight + (index % 2) * (cardHeight + cardGap);
    drawTheoryPdfCard(pdf, card, index, lesson.cardDeck.length, margin, y, cardWidth, cardHeight);
  });

  pdf.save(`${lesson.id}-theory-cards.pdf`);
}

async function downloadLessonModule(lesson: Lesson) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const [erasmusLogo, courseLogo] = await Promise.all([
    imageToDataUrl(erasmusLogoPath),
    imageToDataUrl(courseLogoPath),
  ]);
  drawPdfHeader(pdf, lesson, erasmusLogo, courseLogo);

  let y = 58;
  y = drawModulePdfSection(pdf, 'Definition', lesson.definition, y);
  y = drawModulePdfSection(pdf, 'Why it matters', lesson.whyItMatters, y);
  y = drawModulePdfSection(pdf, 'Board-game pattern', lesson.boardGamePattern, y);
  y = drawModulePdfBullets(pdf, 'Model map', lesson.modelSteps.map((step, index) => `${index + 1}. ${step.label}: ${step.text} Prompt: ${step.prompt}`), y);
  y = drawModulePdfSection(pdf, 'Youth-work lens', lesson.youthWorkLens, y);
  y = drawModulePdfSection(pdf, 'Facilitator move', lesson.facilitatorMove, y);
  y = drawModulePdfSection(pdf, 'Prototype meaning', lesson.tryIt, y);
  y = drawModulePdfSection(pdf, 'Common mistake', lesson.antiPattern, y);
  y = drawModulePdfSection(pdf, 'Mini example', lesson.example, y);
  y = drawModulePdfSection(pdf, 'Trainer backup', lesson.trainerBackup, y);
  y = drawModulePdfSection(pdf, 'Quick check', `${lesson.checkpoint.question}\nCorrect answer: ${lesson.checkpoint.options[lesson.checkpoint.answer]}`, y);
  drawModulePdfBullets(pdf, 'Sources and references', lesson.sources, y);

  pdf.save(`${lesson.id}-module.pdf`);
}

function printLessonCards(lesson: Lesson) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.write(buildPrintableLessonHtml(lesson));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function buildPrintableLessonHtml(lesson: Lesson) {
  const cards = lesson.cardDeck.map((card) => `
    <article class="card">
      <p class="eyebrow">${escapeHtml(card.category)}</p>
      <h2>${escapeHtml(card.front)}</h2>
      <p class="hint">${escapeHtml(card.frontHint)}</p>
      <hr />
      <p>${escapeHtml(card.back)}</p>
      <strong>Prototype prompt</strong>
      <p>${escapeHtml(card.prompt)}</p>
    </article>
  `).join('');

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(lesson.title)} cards</title>
        <style>
          body { margin: 0; padding: 24px; font-family: Inter, Arial, sans-serif; background: #f4eddf; color: #252018; }
          h1 { margin: 0 0 8px; font-family: Georgia, serif; font-size: 28px; }
          .meta { color: #726654; margin: 0 0 24px; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
          .card { min-height: 260px; border: 1px solid #9b8768; border-radius: 14px; padding: 18px; background: #fffaf0; break-inside: avoid; }
          .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #7c4f24; font-weight: 800; }
          h2 { font-size: 24px; margin: 14px 0; }
          p { line-height: 1.45; }
          .header { display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; margin-bottom: 22px; border-bottom: 1px solid #9b8768; padding-bottom: 14px; }
          .logos { display: flex; gap: 14px; align-items: center; justify-content: flex-end; }
          .logos img { max-height: 52px; max-width: 180px; object-fit: contain; }
          .hint { font-weight: 700; color: #355f70; }
          strong { display: block; margin-top: 16px; color: #426b3d; }
          @media print { body { background: white; } .grid { grid-template-columns: repeat(2, 1fr); } }
        </style>
      </head>
      <body>
        <header class="header">
          <div>
            <h1>${escapeHtml(courseInfo.title)} - ${escapeHtml(lesson.title)}</h1>
            <p class="meta">${escapeHtml(courseInfo.programme)} | ${escapeHtml(courseInfo.dates)} | ${escapeHtml(courseInfo.venue)} | ${escapeHtml(courseInfo.code)}</p>
          </div>
          <div class="logos">
            <img src="${escapeHtml(erasmusLogoPath)}" alt="Erasmus+ logo" />
            <img src="${escapeHtml(courseLogoPath)}" alt="Arte Diem Calabria course logos" />
          </div>
        </header>
        <section class="grid">${cards}</section>
      </body>
    </html>`;
}

async function imageToDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load image: ${url}`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read image: ${url}`));
    reader.readAsDataURL(blob);
  });
}

function drawPdfHeader(pdf: PdfDocument, lesson: Lesson, erasmusLogo: string, courseLogo: string) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;

  pdf.setFillColor(244, 237, 223);
  pdf.rect(0, 0, pageWidth, 48, 'F');
  pdf.addImage(erasmusLogo, 'PNG', pageWidth - margin - 42, 9, 42, 14);
  pdf.addImage(courseLogo, 'PNG', pageWidth - margin - 76, 25, 76, 19);

  pdf.setTextColor(37, 32, 24);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(courseInfo.title, margin, 14);
  pdf.setFontSize(10);
  pdf.text(lesson.title, margin, 21);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(114, 102, 84);
  pdf.text(`${courseInfo.programme} | ${courseInfo.dates} | ${courseInfo.venue}`, margin, 28);
  pdf.text(courseInfo.code, margin, 34);
}

function drawModulePdfSection(pdf: PdfDocument, title: string, text: string, y: number) {
  y = ensurePdfSpace(pdf, y, 28);
  const margin = 16;
  const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(124, 79, 36);
  pdf.text(title.toUpperCase(), margin, y);
  y += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(37, 32, 24);
  const lines = pdf.splitTextToSize(text || '-', maxWidth);
  lines.forEach((line: string) => {
    y = ensurePdfSpace(pdf, y, 8);
    pdf.text(line, margin, y);
    y += 5.2;
  });
  return y + 5;
}

function drawModulePdfBullets(pdf: PdfDocument, title: string, items: string[], y: number) {
  y = ensurePdfSpace(pdf, y, 28);
  const margin = 16;
  const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2 - 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(124, 79, 36);
  pdf.text(title.toUpperCase(), margin, y);
  y += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(37, 32, 24);
  items.forEach((item) => {
    const lines = pdf.splitTextToSize(item, maxWidth);
    lines.forEach((line: string, index: number) => {
      y = ensurePdfSpace(pdf, y, 8);
      pdf.text(index === 0 ? '-' : ' ', margin, y);
      pdf.text(line, margin + 5, y);
      y += 5.2;
    });
    y += 2;
  });
  return y + 4;
}

function ensurePdfSpace(pdf: PdfDocument, y: number, needed: number) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - 16) return y;
  pdf.addPage();
  return 20;
}

function drawTheoryPdfCard(pdf: PdfDocument, card: TheoryCard, index: number, total: number, x: number, y: number, width: number, height: number) {
  const inner = 8;
  pdf.setDrawColor(155, 135, 104);
  pdf.setFillColor(255, 250, 240);
  pdf.roundedRect(x, y, width, height, 4, 4, 'FD');

  pdf.setTextColor(124, 79, 36);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text(`${card.category.toUpperCase()}  ${index + 1}/${total}`, x + inner, y + 10);

  pdf.setTextColor(37, 32, 24);
  pdf.setFontSize(18);
  pdf.text(card.front, x + inner, y + 22, { maxWidth: width - inner * 2 });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const frontHintLines = pdf.splitTextToSize(card.frontHint, width - inner * 2);
  pdf.text(frontHintLines, x + inner, y + 34);

  const dividerY = y + 44;
  pdf.setDrawColor(200, 188, 164);
  pdf.line(x + inner, dividerY, x + width - inner, dividerY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const backLines = pdf.splitTextToSize(card.back, width - inner * 2);
  pdf.text(backLines.slice(0, 8), x + inner, dividerY + 8);

  const promptY = y + height - 25;
  pdf.setFillColor(239, 243, 235);
  pdf.roundedRect(x + inner, promptY, width - inner * 2, 17, 3, 3, 'F');
  pdf.setTextColor(66, 107, 61);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('PROTOTYPE PROMPT', x + inner + 3, promptY + 5);
  pdf.setTextColor(37, 32, 24);
  pdf.setFontSize(8.5);
  const promptLines = pdf.splitTextToSize(card.prompt, width - inner * 2 - 6);
  pdf.text(promptLines.slice(0, 2), x + inner + 3, promptY + 11);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
