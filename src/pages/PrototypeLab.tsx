import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clipboard, ClipboardList, Download, FileUp, ImagePlus, Loader2, Printer, RotateCcw, Sparkles, Wand2 } from 'lucide-react';
import { courseInfo, gameCatalog, prototypeSteps } from '../data/course';
import { useStore } from '../store/useStore';

const coachEndpoint = normalizeAiEndpoint(import.meta.env.VITE_AI_COACH_ENDPOINT, '/api/coach');
const imageEndpoint = normalizeAiEndpoint(import.meta.env.VITE_AI_IMAGE_ENDPOINT, '/api/prototype-image');
const courseLogoPath = `${import.meta.env.BASE_URL}arte-diem-course-logos.png`;
const erasmusLogoPath = `${import.meta.env.BASE_URL}erasmus-plus-small.png`;
type PrototypeFieldMap = Record<string, string>;
type GddAnalysisMode = 'offline' | 'ai';
type PrototypeStage = { title: string; helper: string; ids: string[] };

const stagedSteps: PrototypeStage[] = [
  { title: 'Core Concept', helper: 'Start from the title, short summary, and experience pillars.', ids: ['gameTitle', 'executiveSummary', 'experiencePillars'] },
  { title: 'Audience & Platform', helper: 'Name who the game is for and what physical or digital form it uses.', ids: ['targetAudience', 'platforms'] },
  { title: 'Gameplay', helper: 'Make actions, goals, obstacles, and interface clear enough to test.', ids: ['gameplayMechanics', 'playerGoals', 'obstacles', 'interface'] },
  { title: 'World & Field Research', helper: 'Turn Filadelfia field research into spaces, stories, NPCs, and hidden elements.', ids: ['settingGenre', 'places', 'localStories', 'npcs', 'hiddenElements'] },
  { title: 'Learning & Testing', helper: 'Connect the board game to youth work learning, debrief, and playtesting.', ids: ['learningGoal', 'debriefQuestion', 'playtestPlan'] },
];

const legacyPrototypeFieldMap: Record<string, string[]> = {
  gameTitle: ['topic'],
  targetAudience: ['targetGroup'],
  gameplayMechanics: ['coreMechanic'],
  playerGoals: ['winCondition'],
  platforms: ['materials'],
  obstacles: ['rules'],
  interface: ['rules'],
};

function normalizeAiEndpoint(value: string | undefined, fallback: string) {
  const endpoint = String(value || '').trim();
  if (!endpoint) return fallback;
  if (endpoint.includes('your-worker') || endpoint.includes('your-account') || endpoint.includes('example.com')) return fallback;
  return endpoint;
}

export default function PrototypeLab() {
  const { prototype, gameTakeaways, gameNotes, coachNotes, gddImports, updatePrototypeField, saveGddImport } = useStore();
  const [actionMessage, setActionMessage] = useState('');
  const [gddText, setGddText] = useState('');
  const [gddPreview, setGddPreview] = useState<PrototypeFieldMap | null>(null);
  const [gddStatus, setGddStatus] = useState('');
  const [gddFileName, setGddFileName] = useState('');
  const [isAnalyzingGdd, setIsAnalyzingGdd] = useState(false);
  const [isLoadingGddFile, setIsLoadingGddFile] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [prototypeImage, setPrototypeImage] = useState('');
  const [prototypeImageStatus, setPrototypeImageStatus] = useState('');
  const [isGeneratingPrototypeImage, setIsGeneratingPrototypeImage] = useState(false);
  const readPrototypeField = (id: string) => getPrototypeFieldValue(prototype, id);
  const completedSteps = prototypeSteps.filter((step) => readPrototypeField(step.id).trim()).length;
  const progressPercent = Math.round((completedSteps / prototypeSteps.length) * 100);
  const hasGddText = Boolean(gddText.trim());
  const aiImportReady = Boolean(coachEndpoint && hasGddText && !isAnalyzingGdd && !isLoadingGddFile);
  const gddHelperText = !hasGddText
    ? 'Load a GDD file or paste text first.'
    : 'AI can improve the imported GDD with Simple English and emoji bullets.';

  const buildPrototypeCardText = () => {
    const fields = prototypeSteps
      .map((step) => `${step.label}: ${readPrototypeField(step.id).trim() || '-'}`)
      .join('\n');
    return `Games Are No Joke - Prototype Card\n\n${fields}`;
  };

  const copyPrototypeCard = async () => {
    try {
      await navigator.clipboard?.writeText(buildPrototypeCardText());
      setActionMessage('Prototype Card copied. You can paste it anywhere.');
    } catch {
      setActionMessage('Copy did not work in this browser. Use Save File instead.');
    }
  };

  const savePrototypeCard = () => {
    const blob = new Blob([buildPrototypeCardText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (readPrototypeField('gameTitle') || 'games-are-no-joke-prototype').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    link.href = url;
    link.download = `${safeTitle || 'games-are-no-joke-prototype'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage('Prototype Card saved as a text file.');
  };

  const downloadGddDocx = () => {
    const blob = buildGddDocx(readPrototypeField);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (readPrototypeField('gameTitle') || 'games-are-no-joke-gdd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    link.href = url;
    link.download = `${safeTitle || 'games-are-no-joke-gdd'}.docx`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage('Final GDD downloaded as a Word .docx file.');
  };

  const printPrototypeCard = () => {
    window.print();
    setActionMessage('Print view opened. Choose Save as PDF if you want a PDF.');
  };

  const generatePrototypeImage = async () => {
    const prompt = buildPrototypeImagePrompt(readPrototypeField);
    if (!prompt) {
      setPrototypeImageStatus('Add at least a game title, setting, mechanics, or field research before generating an image.');
      return;
    }
    setIsGeneratingPrototypeImage(true);
    setPrototypeImageStatus('Generating board game box image with Gemini...');
    try {
      const response = await fetch(imageEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json() as { imageDataUrl?: string; error?: string };
      if (!response.ok || !data.imageDataUrl) {
        throw new Error(data.error || 'Image generation failed.');
      }
      const composited = await composeLogoOnImage(data.imageDataUrl, courseLogoPath);
      setPrototypeImage(composited);
      setPrototypeImageStatus('Image ready. The course logo was applied in the top-left corner.');
    } catch (error) {
      setPrototypeImageStatus(error instanceof Error ? error.message : 'Image generation failed. Try again later.');
    } finally {
      setIsGeneratingPrototypeImage(false);
    }
  };

  const downloadPrototypeImage = () => {
    if (!prototypeImage) return;
    const link = document.createElement('a');
    const safeTitle = (readPrototypeField('gameTitle') || 'games-are-no-joke-boardgame-box').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    link.href = prototypeImage;
    link.download = `${safeTitle || 'games-are-no-joke-boardgame-box'}.png`;
    link.click();
    setActionMessage('Board game box image downloaded.');
  };

  const analyzeGddSource = async (sourceText: string, mode: GddAnalysisMode, loadedFrom?: string) => {
    const source = sourceText.trim();
    if (!source) {
      setGddStatus('No filled GDD content found. Load a completed GDD file or paste the text first.');
      setGddPreview(null);
      return;
    }

    setIsAnalyzingGdd(true);
    setGddStatus('');
    try {
      const fields = mode === 'ai' && coachEndpoint
        ? await analyzeGddWithAi(coachEndpoint, source)
        : analyzeGddOffline(source);

      if (!Object.values(fields).some((value) => value.trim())) {
        setGddStatus('No filled GDD content found. The text looks like an empty template.');
        setGddPreview(null);
      } else {
        setGddPreview(fields);
        const sourceLabel = loadedFrom ? ` from ${loadedFrom}` : '';
        setGddStatus(mode === 'ai' ? `AI improved analysis ready${sourceLabel}. Review the preview before applying.` : `Offline analysis ready${sourceLabel}. Review the preview before applying.`);
      }
    } catch (error) {
      if (mode === 'ai') {
        const message = error instanceof Error ? error.message : 'AI request failed.';
        setGddPreview(null);
        setGddStatus(`${message} Use Analyze Offline to import the GDD without AI improvement.`);
      } else {
        setGddPreview(null);
        setGddStatus('Offline analysis failed. Check that the GDD has filled headings and try again.');
      }
    } finally {
      setIsAnalyzingGdd(false);
    }
  };

  const analyzeGdd = async (mode: GddAnalysisMode) => {
    await analyzeGddSource(gddText, mode, gddFileName || undefined);
  };

  const loadGddFile = async (file: File | undefined) => {
    if (!file) return;
    setIsLoadingGddFile(true);
    setGddPreview(null);
    setGddFileName(file.name);
    setGddStatus(`Loading ${file.name}...`);
    try {
      const text = await extractGddFileText(file);
      setGddText(text);
      if (!text.trim()) {
        setGddStatus('The file was loaded, but no readable text was found.');
        return;
      }
      setGddStatus(`File loaded: ${file.name}. Choose Analyze Offline or Improve With AI.`);
    } catch (error) {
      setGddPreview(null);
      setGddStatus(error instanceof Error ? error.message : 'Could not load this file. Try a .docx or .txt file.');
    } finally {
      setIsLoadingGddFile(false);
    }
  };

  const applyGddPreview = () => {
    if (!gddPreview) return;
    let changed = 0;
    prototypeSteps.forEach((step) => {
      const nextValue = gddPreview[step.id]?.trim();
      const existingValue = readPrototypeField(step.id).trim();
      if (!nextValue) return;
      if (existingValue && !overwriteExisting) return;
      updatePrototypeField(step.id, nextValue);
      changed += 1;
    });
    if (changed === 0) {
      setGddStatus('No fields were updated. Turn on overwrite or clear existing fields first.');
      return;
    }
    saveGddImport({
      id: createId(),
      title: gddPreview.gameTitle?.trim() || 'Imported Simplified GDD',
      createdAt: new Date().toISOString(),
    });
    setGddStatus(`Prototype fields updated: ${changed}.`);
    setActionMessage('Simplified GDD imported into the Prototype Card.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 space-y-4">
      <section className="notebook-surface arcade-border-green glass-panel-green rounded-xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Prototype Lab</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">Design Your First Game Prototype</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-3xl">
              Learn models, play design games, build a prototype, then reflect. Fill one small field at a time and keep the first version clear enough to test.
            </p>
          </div>
          <div className="notebook-card bg-black/60 border border-green-400/30 rounded-xl p-4 min-w-[170px]">
            <div className="flex items-center justify-between text-xs font-bold text-green-300 uppercase">
              <span>Ready</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 rounded bg-green-900/40 mt-3 overflow-hidden">
              <div className="h-full bg-green-400" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-3">{completedSteps}/{prototypeSteps.length} fields completed</p>
          </div>
        </div>
      </section>

      <section className="notebook-surface arcade-border glass-panel rounded-xl p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Import Simplified GDD</p>
            <h2 className="mt-3 text-xl font-arcade text-white">Load or Paste GDD</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300">
              Load a filled Simplified GDD file, or paste the text. Choose offline analysis for faithful mapping, or AI improvement for clearer Simple English with emoji.
            </p>
          </div>
          <div className="notebook-card rounded-xl border border-cyan-300/25 bg-black/45 p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="notebook-chip rounded-full border border-green-300/35 bg-green-300/10 px-2.5 py-1 text-[10px] font-black uppercase text-green-100">Offline ready</span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${coachEndpoint ? 'border-cyan-300/35 bg-cyan-300/10 text-cyan-100' : 'border-yellow-300/35 bg-yellow-300/10 text-yellow-100'}`}>
                {coachEndpoint ? 'AI connected' : 'AI not connected'}
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-gray-400">Imports saved: {gddImports.length}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div>
            <div className="notebook-card rounded-xl border border-cyan-300/25 bg-black/45 p-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-cyan-300/35 bg-cyan-300/10 px-4 py-6 text-center transition-colors hover:bg-cyan-300/15">
                {isLoadingGddFile ? <Loader2 className="h-6 w-6 animate-spin text-cyan-200" /> : <FileUp className="h-6 w-6 text-cyan-200" />}
                <span className="text-sm font-black uppercase text-cyan-100">
                  {isLoadingGddFile ? 'Loading GDD file...' : 'Load GDD file'}
                </span>
                <span className="max-w-md text-xs leading-relaxed text-gray-400">
                  Upload a completed `.docx` Simplified GDD. `.txt` also works. Then choose Offline or AI analysis.
                </span>
                <input
                  type="file"
                  accept=".docx,.txt,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  disabled={isLoadingGddFile || isAnalyzingGdd}
                  onChange={(event) => {
                    void loadGddFile(event.target.files?.[0]);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              {gddFileName && <p className="mt-3 text-xs font-bold uppercase tracking-widest text-cyan-200">Loaded file: {gddFileName}</p>}
            </div>

            <label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-gray-400" htmlFor="gdd-import-text">
              Filled GDD text / extracted file text
            </label>
            <textarea
              id="gdd-import-text"
              value={gddText}
              onChange={(event) => setGddText(event.target.value)}
              rows={2}
              className="notebook-scroll-area mt-2 max-h-32 w-full overflow-y-auto rounded-lg border border-white/10 bg-black/70 px-3 py-3 text-sm text-white tracking-normal outline-none focus:border-cyan-400 resize-y"
              placeholder="Load a .docx GDD file above, or paste the completed Simplified GDD here: Game Title, Executive Summary, Audience, Goals, Obstacles, Interface, Field Research Data..."
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-2 text-xs font-bold uppercase text-gray-300">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(event) => setOverwriteExisting(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black"
                />
                Overwrite existing fields
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => void analyzeGdd('offline')}
                  disabled={isAnalyzingGdd || isLoadingGddFile || !hasGddText}
                  className="gdd-action-button gdd-action-button-cyan inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-xs font-bold uppercase transition-colors disabled:cursor-not-allowed"
                >
                  {isAnalyzingGdd ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                  Analyze Offline
                </button>
                <button
                  onClick={() => void analyzeGdd('ai')}
                  disabled={!aiImportReady}
                  title={coachEndpoint ? 'Improve the GDD with AI' : 'Set VITE_AI_COACH_ENDPOINT to enable AI improvement'}
                  className="gdd-action-button gdd-action-button-pink inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-xs font-bold uppercase transition-colors disabled:cursor-not-allowed"
                >
                  {isAnalyzingGdd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Improve With AI
                </button>
              </div>
            </div>
            <p className={`mt-3 rounded-lg border px-3 py-2 text-xs font-bold leading-relaxed ${aiImportReady ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : hasGddText ? 'border-yellow-300/30 bg-yellow-300/10 text-yellow-100' : 'border-white/10 bg-white/[.04] text-gray-300'}`}>
              {gddHelperText}
            </p>
            {gddStatus && <p className="mt-3 text-xs font-bold uppercase tracking-widest text-yellow-200">{gddStatus}</p>}
          </div>

          <div className="notebook-card rounded-xl border border-white/10 bg-black/45 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Import Preview</p>
              <Sparkles className="h-5 w-5 text-cyan-300" />
            </div>
            {!gddPreview && <p className="mt-4 text-sm leading-relaxed text-gray-400">Analyze a filled GDD to preview proposed fields here.</p>}
            {gddPreview && (
              <>
                <div className="notebook-scroll-area mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
	                  {stagedSteps.map((stage) => (
	                    <div key={stage.title} className="space-y-2">
	                      <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-cyan-300">{stage.title}</p>
	                      {prototypeSteps.filter((step) => stage.ids.includes(step.id)).map((step) => {
	                    const value = gddPreview[step.id]?.trim();
	                    const protectedField = Boolean(readPrototypeField(step.id).trim()) && !overwriteExisting;
	                    return (
	                      <div key={step.id} className="notebook-muted-card rounded-lg border border-white/10 bg-black/45 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] font-black uppercase text-gray-500">{step.label}</p>
                          {protectedField && <span className="text-[9px] font-bold uppercase text-yellow-200">Protected</span>}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-gray-200">{value || '-'}</p>
	                      </div>
	                    );
	                  })}
	                    </div>
	                  ))}
                </div>
                <button
                  onClick={applyGddPreview}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-green-300/40 bg-green-300/10 px-4 py-3 text-xs font-bold uppercase text-green-100 hover:bg-green-300 hover:text-black"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Apply to Prototype Card
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {stagedSteps.map((stage) => (
          <div key={stage.title} className="notebook-surface reading-panel p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-green-300 font-bold uppercase tracking-widest">{stage.title}</p>
                <p className="mt-2 text-sm text-gray-300 readable-copy">{stage.helper}</p>
              </div>
	              <span className="text-[10px] font-bold uppercase text-gray-500">
	                {stage.ids.filter((id) => readPrototypeField(id).trim()).length}/{stage.ids.length} ready
	              </span>
            </div>

            <div className="mt-4 space-y-3">
              {prototypeSteps.filter((step) => stage.ids.includes(step.id)).map((step) => {
	                const currentValue = readPrototypeField(step.id);
	                const isDone = Boolean(currentValue.trim());
                const absoluteIndex = prototypeSteps.findIndex((item) => item.id === step.id) + 1;
                return (
                  <div key={step.id} className="notebook-card bg-black/45 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${isDone ? 'border-green-400 bg-green-400/10' : 'border-gray-700 bg-black/60'}`}>
                        {isDone ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <step.icon className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h2 className="text-sm font-bold text-white">{absoluteIndex}. {step.label}</h2>
                          <span className="text-[10px] text-gray-500 font-bold uppercase">{isDone ? 'Saved' : 'Draft'}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 readable-copy">{step.prompt}</p>
                        <textarea
	                          value={currentValue}
	                          onChange={(event) => updatePrototypeField(step.id, event.target.value)}
	                          rows={['executiveSummary', 'experiencePillars', 'gameplayMechanics', 'obstacles', 'interface', 'places', 'localStories', 'npcs', 'hiddenElements', 'playtestPlan'].includes(step.id) ? 4 : 3}
                          className="mt-3 w-full rounded-lg border border-white/10 bg-black/70 px-3 py-3 text-sm text-white tracking-normal outline-none focus:border-green-400 resize-y"
                          placeholder={`Write ${step.label.toLowerCase()} in simple English...`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="notebook-surface arcade-border-pink glass-panel-pink rounded-xl p-5 md:p-6 print:border-0 print:bg-white print:text-black">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Live Output</p>
              <h2 className="text-lg font-arcade text-white mt-2">Prototype Card</h2>
            </div>
            <ClipboardList className="w-8 h-8 text-pink-400" />
          </div>

          <PrototypeSheet readPrototypeField={readPrototypeField} />

          <div className="notebook-card mt-5 rounded-xl border border-pink-300/30 bg-black/45 p-4 print:hidden">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-pink-200">AI Box Visualizer</p>
                <h3 className="mt-2 text-lg font-arcade text-white">Generate Board Game Box Image</h3>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300">
                  Create a visual mockup of your prototype as a finished board game box, placed inside the world described in your GDD. The official course logo is applied after generation.
                </p>
              </div>
              <button
                onClick={() => void generatePrototypeImage()}
                disabled={isGeneratingPrototypeImage}
                title="Generate a board game box image"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-pink-300/40 bg-pink-300/10 px-4 py-3 text-xs font-bold uppercase text-pink-100 transition-colors hover:bg-pink-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isGeneratingPrototypeImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Generate Image
              </button>
            </div>

            {prototypeImageStatus && <p className="mt-3 text-xs font-bold uppercase tracking-widest text-yellow-200">{prototypeImageStatus}</p>}
            {prototypeImage && (
              <div className="mt-4">
                <img
                  src={prototypeImage}
                  alt="Generated board game box prototype with course logo"
                  className="w-full rounded-xl border border-white/15 bg-black object-contain"
                />
                <button
                  onClick={downloadPrototypeImage}
                  className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-green-300/40 bg-green-300/10 px-4 py-3 text-xs font-bold uppercase text-green-100 transition-colors hover:bg-green-300 hover:text-black"
                >
                  <Download className="h-4 w-4" />
                  Download Image
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 print:hidden">
            <button
              onClick={copyPrototypeCard}
              className="flex items-center justify-center gap-2 rounded-lg border border-pink-400 bg-pink-400/10 px-3 py-3 text-xs font-bold uppercase text-pink-100 hover:bg-pink-400 hover:text-black transition-colors"
            >
              <Clipboard className="w-4 h-4" /> Copy Text
            </button>
            <button
              onClick={savePrototypeCard}
              className="flex items-center justify-center gap-2 rounded-lg border border-green-400 bg-green-400/10 px-3 py-3 text-xs font-bold uppercase text-green-100 hover:bg-green-400 hover:text-black transition-colors"
            >
              <Download className="w-4 h-4" /> Save File
            </button>
            <button
              onClick={downloadGddDocx}
              className="flex items-center justify-center gap-2 rounded-lg border border-yellow-300 bg-yellow-300/10 px-3 py-3 text-xs font-bold uppercase text-yellow-100 hover:bg-yellow-300 hover:text-black transition-colors"
            >
              <Download className="w-4 h-4" /> GDD .docx
            </button>
            <button
              onClick={printPrototypeCard}
              className="flex items-center justify-center gap-2 rounded-lg border border-cyan-400 bg-cyan-400/10 px-3 py-3 text-xs font-bold uppercase text-cyan-100 hover:bg-cyan-400 hover:text-black transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
	            <button
	              onClick={() => [...prototypeSteps.map((step) => step.id), ...Object.values(legacyPrototypeFieldMap).flat()].forEach((id) => updatePrototypeField(id, ''))}
	              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-xs font-bold uppercase text-gray-300 hover:border-red-400 hover:text-red-300 transition-colors"
	            >
              <RotateCcw className="w-4 h-4" /> Clear Draft
            </button>
          </div>
          {actionMessage && <p className="mt-3 text-xs font-bold uppercase tracking-widest text-green-200">{actionMessage}</p>}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="notebook-surface arcade-border glass-panel rounded-xl p-5">
          <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Ideas From The Games</p>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            These are design lessons from the playable games. Use one if you need help filling a prototype field.
          </p>
          <div className="mt-4 space-y-3">
            {gameCatalog.map((game) => (
              <div key={game.id} className="notebook-card rounded-lg border border-white/10 bg-black/50 p-3">
                <p className="text-sm text-white font-bold">{game.title}</p>
                <p className="text-xs text-gray-300 leading-relaxed mt-2">{gameTakeaways[game.id] || game.prototypePrompt}</p>
                {gameNotes[game.id] && <p className="text-xs text-cyan-300 leading-relaxed mt-2">Prototype note: {gameNotes[game.id]}</p>}
                <button
	                  onClick={() => updatePrototypeField(game.id === 'filadelfia-story' || game.id === 'youthpass-drop' ? 'debriefQuestion' : 'gameplayMechanics', game.prototypePrompt)}
                  className="mt-3 rounded border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[10px] font-bold uppercase text-cyan-100 hover:bg-cyan-300 hover:text-black"
                >
                  Use as prompt
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="notebook-surface bg-black/60 border border-white/10 rounded-xl p-5">
          <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Saved AI Coach Suggestions</p>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            These are answers you saved from the AI Coach. Use them only if they help your prototype.
          </p>
          <div className="mt-4 space-y-3">
            {coachNotes.length === 0 && <p className="text-sm text-gray-400">Saved coach notes will appear here.</p>}
            {coachNotes.slice(0, 4).map((note) => (
              <div key={note.id} className="rounded-lg border border-white/10 bg-black/50 p-3">
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
	                    onClick={() => updatePrototypeField('gameplayMechanics', note.text)}
                    className="rounded border border-green-300/30 bg-green-300/10 px-3 py-2 text-[10px] font-bold uppercase text-green-100 hover:bg-green-300 hover:text-black"
                  >
	                    Use for mechanics
                  </button>
                  <button
                    onClick={() => updatePrototypeField('debriefQuestion', note.text)}
                    className="rounded border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[10px] font-bold uppercase text-cyan-100 hover:bg-cyan-300 hover:text-black"
                  >
                    Use for debrief
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function PrototypeSheet({ readPrototypeField }: { readPrototypeField: (id: string) => string }) {
  const title = readPrototypeField('gameTitle').trim() || 'Untitled board game prototype';
  const summary = readPrototypeField('executiveSummary').trim();
  const pillars = readPrototypeField('experiencePillars').trim();

  return (
    <article className="prototype-sheet-print-area mt-5 overflow-hidden rounded-2xl border border-black/15 bg-[#fffaf0] text-[#201a12] shadow-2xl">
      <header className="grid gap-5 border-b border-black/15 bg-white px-5 py-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#0f55a6]">{courseInfo.programme}</p>
          <h3 className="mt-2 text-2xl font-black leading-tight md:text-3xl">{courseInfo.title}</h3>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#665d50]">
            {courseInfo.dates} · {courseInfo.venue} · Project code {courseInfo.code}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <img src={erasmusLogoPath} alt="Erasmus+ logo" className="h-10 w-auto object-contain" />
          <img src={courseLogoPath} alt="Arte Diem Calabria and project logos" className="h-12 w-auto max-w-[220px] object-contain" />
        </div>
      </header>

      <div className="px-5 py-5 md:px-7">
        <div className="rounded-2xl border border-[#cfc5b3] bg-[#f8efd8] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7c4b1f]">Prototype Sheet</p>
          <h4 className="mt-2 text-3xl font-black leading-tight md:text-4xl">{title}</h4>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.5fr_1fr]">
            <PrototypeSheetBlock label="Executive Summary" value={summary} large />
            <PrototypeSheetBlock label="Experience Pillars" value={pillars} />
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {stagedSteps.map((stage) => (
            <section key={stage.title} className="rounded-2xl border border-[#d7cdbb] bg-white/70 p-4">
              <div className="flex flex-col gap-1 border-b border-[#d7cdbb] pb-3 sm:flex-row sm:items-end sm:justify-between">
                <h5 className="text-sm font-black uppercase tracking-widest text-[#315f73]">{stage.title}</h5>
                <p className="text-xs font-semibold leading-relaxed text-[#756c5f]">{stage.helper}</p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {prototypeSteps.filter((step) => stage.ids.includes(step.id) && !['executiveSummary', 'experiencePillars'].includes(step.id)).map((step) => (
                  <PrototypeSheetBlock
                    key={step.id}
                    label={step.label}
                    value={readPrototypeField(step.id).trim()}
                    large={['gameplayMechanics', 'obstacles', 'interface', 'places', 'localStories', 'npcs', 'hiddenElements', 'playtestPlan'].includes(step.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-5 flex flex-col gap-2 border-t border-[#d7cdbb] pt-4 text-xs font-semibold text-[#665d50] sm:flex-row sm:items-center sm:justify-between">
          <span>Generated inside the Games Are No Joke Companion App.</span>
          <span>Hosted by {courseInfo.host}</span>
        </footer>
      </div>
    </article>
  );
}

function PrototypeSheetBlock({ label, value, large = false }: { label: string; value: string; large?: boolean; key?: string }) {
  return (
    <div className={large ? 'md:col-span-2' : ''}>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#7b7164]">{label}</p>
      <p className="mt-1 min-h-10 whitespace-pre-wrap rounded-xl border border-[#d8cebd] bg-[#fffdf8] px-3 py-2 text-sm font-semibold leading-relaxed text-[#201a12]">
        {value || 'To complete'}
      </p>
    </div>
  );
}

async function extractGddFileText(file: File) {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.txt') || file.type === 'text/plain') {
    return file.text();
  }

  if (lowerName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value
      .replace(/\r/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  throw new Error('Unsupported file type. Please load a .docx or .txt Simplified GDD file.');
}

function buildPrototypeImagePrompt(readField: (id: string) => string) {
  const title = readField('gameTitle').trim();
  const summary = readField('executiveSummary').trim();
  const pillars = readField('experiencePillars').trim();
  const audience = readField('targetAudience').trim();
  const mechanics = readField('gameplayMechanics').trim();
  const goals = readField('playerGoals').trim();
  const obstacles = readField('obstacles').trim();
  const setting = readField('settingGenre').trim();
  const places = readField('places').trim();
  const stories = readField('localStories').trim();
  const npcs = readField('npcs').trim();
  const hidden = readField('hiddenElements').trim();
  const learningGoal = readField('learningGoal').trim();

  if (![title, summary, mechanics, setting, places, learningGoal].some(Boolean)) return '';

  return `Create a polished product mockup image for an original youth-work board game prototype.

Image goal:
- Show a full ready board game box as the central object.
- The box should look finished and professional, like a real tabletop game product.
- Place the game box immersed in the world/context described below, not on a blank background.
- Around the box, show a few board-game components: cards, tokens, dice, route/map board, or character standees if relevant.
- Do not create any blank label, white plaque, beige plate, square panel, sticker, or reserved box for logos or project text.
- Keep the top-left and bottom-right visually calm enough for a small transparent overlay, but the background must remain part of the scene.
- The app will apply the official Erasmus+/Arte Diem/Agenzia logo and project text after generation, so do not generate them inside the scene.
- Do not invent copyrighted logos or brand marks.
- Use warm cinematic lighting and clear readable composition.
- If text appears on the box, use the title: "${title || 'Games Are No Joke Prototype'}".

Prototype data:
Title: ${title || 'Untitled prototype'}
Executive summary: ${summary || '-'}
Experience pillars: ${pillars || '-'}
Target audience: ${audience || 'young people in an Erasmus+ youth-work context'}
Gameplay mechanics: ${mechanics || '-'}
Player goals: ${goals || '-'}
Obstacles: ${obstacles || '-'}
Setting and genre: ${setting || '-'}
Places and points of interest: ${places || '-'}
Local stories or legends: ${stories || '-'}
Characters and NPCs: ${npcs || '-'}
Hidden elements: ${hidden || '-'}
Learning goal: ${learningGoal || '-'}

Style:
High quality board game box mockup, realistic 3D product render, inviting youth-work atmosphere, clear visual storytelling, no violence, no alcohol focus, no photorealistic faces of real participants.`;
}

function buildGddDocx(readField: (id: string) => string) {
  const documentXml = buildDocumentXml(readField);
  const files: Record<string, string> = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`,
    'word/document.xml': documentXml,
  };
  return createDocxZip(files);
}

function buildDocumentXml(readField: (id: string) => string) {
  const title = readField('gameTitle').trim() || 'Untitled board game prototype';
  const bodyParts = [
    docParagraph(courseInfo.title, 'Title'),
    docParagraph(`${courseInfo.dates} - ${courseInfo.venue}`, 'Subtitle'),
    docParagraph(`Project code: ${courseInfo.code}`),
    docParagraph(`Hosted by: ${courseInfo.host}`),
    docParagraph(`Generated GDD: ${new Date().toLocaleDateString()}`),
    docParagraph('Final Simplified GDD', 'Heading1'),
    docParagraph(title, 'Heading2'),
    ...stagedSteps.flatMap((stage) => [
      docParagraph(stage.title, 'Heading1'),
      ...prototypeSteps
        .filter((step) => stage.ids.includes(step.id))
        .flatMap((step) => [
          docParagraph(step.label, 'Heading2'),
          ...docMultilineParagraphs(readField(step.id).trim() || '-'),
        ]),
    ]),
    docParagraph('Course identity', 'Heading1'),
    docParagraph('Erasmus+ - Arte Diem Calabria - Agenzia Italiana per la Gioventu'),
  ].join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyParts}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function docMultilineParagraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => docParagraph(block))
    .join('');
}

function docParagraph(text: string, style: 'Title' | 'Subtitle' | 'Heading1' | 'Heading2' | 'Normal' = 'Normal') {
  const styleXml = style === 'Normal' ? '' : `<w:pStyle w:val="${style}"/>`;
  const runStyle = style === 'Title'
    ? '<w:b/><w:sz w:val="40"/>'
    : style === 'Subtitle'
      ? '<w:color w:val="2A5B73"/><w:sz w:val="24"/>'
      : style === 'Heading1'
        ? '<w:b/><w:color w:val="7A4B23"/><w:sz w:val="30"/>'
        : style === 'Heading2'
          ? '<w:b/><w:color w:val="243B53"/><w:sz w:val="24"/>'
          : '<w:sz w:val="22"/>';
  const lines = text.split('\n').map((line, index) => `${index > 0 ? '<w:br/>' : ''}<w:t xml:space="preserve">${escapeXml(line)}</w:t>`).join('');
  return `<w:p><w:pPr>${styleXml}<w:spacing w:after="160"/></w:pPr><w:r><w:rPr>${runStyle}</w:rPr>${lines}</w:r></w:p>`;
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createDocxZip(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  Object.entries(files).forEach(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    chunks.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralDirectory.push(centralHeader);
    offset += localHeader.length + data.length;
  });

  const centralOffset = offset;
  centralDirectory.forEach((chunk) => {
    chunks.push(chunk);
    offset += chunk.length;
  });

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, centralDirectory.length, true);
  endView.setUint16(10, centralDirectory.length, true);
  endView.setUint32(12, offset - centralOffset, true);
  endView.setUint32(16, centralOffset, true);
  chunks.push(end);

  return new Blob(chunks, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  data.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

async function composeLogoOnImage(imageDataUrl: string, logoUrl: string) {
  const [image, logo] = await Promise.all([loadImage(imageDataUrl), loadImage(logoUrl)]);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare image preview.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const padding = Math.round(canvas.width * 0.018);
  const maxLogoWidth = Math.round(canvas.width * 0.18);
  const maxLogoHeight = Math.round(canvas.height * 0.09);
  const scale = Math.min(maxLogoWidth / logo.width, maxLogoHeight / logo.height);
  const logoWidth = Math.round(logo.width * scale);
  const logoHeight = Math.round(logo.height * scale);

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.shadowColor = 'rgba(255, 255, 255, 0.68)';
  context.shadowBlur = Math.max(7, canvas.width * 0.006);
  context.shadowOffsetY = 0;
  context.drawImage(logo, padding, padding, logoWidth, logoHeight);
  context.restore();

  drawProjectSignature(context, canvas.width, canvas.height);

  return canvas.toDataURL('image/png');
}

function drawProjectSignature(context: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
  const padding = Math.round(canvasWidth * 0.018);
  const titleFontSize = Math.max(18, Math.round(canvasWidth * 0.018));
  const metaFontSize = Math.max(12, Math.round(canvasWidth * 0.011));
  const title = courseInfo.title;
  const meta = `${courseInfo.dates} · ${courseInfo.venue}`;

  context.save();
  context.textAlign = 'right';
  context.textBaseline = 'alphabetic';
  context.shadowColor = 'rgba(255, 255, 255, 0.9)';
  context.shadowBlur = Math.max(8, canvasWidth * 0.007);
  context.lineJoin = 'round';
  const textRight = canvasWidth - padding;
  const y = canvasHeight - padding - metaFontSize * 1.35;
  context.strokeStyle = 'rgba(255, 253, 247, 0.92)';
  context.lineWidth = Math.max(4, Math.round(canvasWidth * 0.004));
  context.font = `800 ${titleFontSize}px Inter, Arial, sans-serif`;
  context.strokeText(title, textRight, y);
  context.fillStyle = '#172033';
  context.fillText(title, textRight, y);
  context.font = `700 ${metaFontSize}px Inter, Arial, sans-serif`;
  context.strokeStyle = 'rgba(255, 253, 247, 0.92)';
  context.lineWidth = Math.max(3, Math.round(canvasWidth * 0.003));
  context.strokeText(meta, textRight, y + metaFontSize * 1.45);
  context.fillStyle = '#27536c';
  context.fillText(meta, textRight, y + metaFontSize * 1.45);
  context.restore();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image asset.'));
    image.src = src;
  });
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

async function analyzeGddWithAi(endpoint: string, gddText: string): Promise<PrototypeFieldMap> {
  const fieldKeys = prototypeSteps.map((step) => step.id).join(', ');
  const fieldLabels = prototypeSteps.map((step) => `${step.id}: ${step.label}`).join('\n');
  const offlineFields = analyzeGddOffline(gddText);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'gdd-import',
      question: `Analyze this filled Simplified GDD for a youth-work board game prototype. Return ONLY valid JSON with these exact string keys: ${fieldKeys}.\n\nField labels:\n${fieldLabels}\n\nRules:\n- Improve the text in Simple English.\n- Keep the participant idea intact.\n- Fill missing fields when the GDD gives enough context to infer a useful answer.\n- If a field is inferred, expanded, or completed by AI rather than clearly present in the GDD, start that field value with exactly: AI Suggested: \n- Add short emoji bullets inside field values where they improve readability, for example 🎯, 🧩, 🗺️, 👥, ⚠️, 💬, 🧪.\n- Do not add markdown fences.\n\nGDD TEXT:\n${gddText.slice(0, 14000)}`,
      prototype: {},
      gameTakeaways: {},
      gameNotes: {},
    }),
  });

  if (!response.ok) {
    throw new Error(await readBackendError(response, `GDD import backend returned ${response.status}.`));
  }

  const data = await response.json() as { answer?: string };
  const answer = data.answer ?? '';
  const parsed = parseJsonFieldMap(answer);
  return parsed ? markAiSuggestedFields(parsed, offlineFields) : offlineFields;
}

function markAiSuggestedFields(aiFields: PrototypeFieldMap, sourceFields: PrototypeFieldMap): PrototypeFieldMap {
  const marked = { ...aiFields };
  prototypeSteps.forEach((step) => {
    const aiValue = marked[step.id]?.trim();
    if (!aiValue || aiValue.toLowerCase().startsWith('ai suggested:')) return;

    const sourceValue = sourceFields[step.id]?.trim();
    if (!sourceValue) {
      marked[step.id] = `AI Suggested: ${aiValue}`;
    }
  });
  return marked;
}

async function readBackendError(response: Response, fallback: string) {
  try {
    const data = await response.clone().json() as { error?: string };
    if (data.error?.trim()) return data.error.trim();
  } catch {
    // ignore JSON parse failure
  }

  try {
    const text = (await response.text()).trim();
    if (text) return text;
  } catch {
    // ignore text read failure
  }

  return fallback;
}

function analyzeGddOffline(gddText: string): PrototypeFieldMap {
  const cleaned = removeTemplateNoise(gddText);
  if (cleaned.trim().length < 60) return emptyPrototypeMap();

  const gameTitle = extractSection(cleaned, ['Game Title'], ['Executive Summary', 'Experience Pillars', 'Target Audience', 'Audience']);
  const summary = extractSection(cleaned, ['Executive Summary'], ['Experience Pillars', 'Target Audience', 'Audience']);
  const pillars = extractSection(cleaned, ['Experience Pillars'], ['Target Audience', 'Audience', 'Platform']);
  const audience = extractSection(cleaned, ['Target Audience', 'Audience'], ['Platform', 'Gameplay Mechanics']);
  const platform = extractSection(cleaned, ['Platform(s)', 'Platforms', 'Platform'], ['Gameplay Mechanics', 'Goals of the Player']);
  const mechanics = extractSection(cleaned, ['Gameplay Mechanics'], ['Goals of the Player', 'Obstacles Blocking Those Goals', 'Obstacles']);
  const goals = extractSection(cleaned, ['Goals of the Player'], ['Obstacles Blocking Those Goals', 'Obstacles', 'Interface']);
  const obstacles = extractSection(cleaned, ['Obstacles Blocking Those Goals', 'Obstacles'], ['Interface', 'World & Narrative']);
  const gameInterface = extractSection(cleaned, ['Interface'], ['World & Narrative', 'Setting and Genre']);
  const setting = extractSection(cleaned, ['Setting and Genre'], ['Places & Points of Interest', 'Story, History & Culture', 'Main Characters']);
  const places = extractSection(cleaned, ['Places & Points of Interest'], ['Story, History & Culture', 'Local Legends']);
  const stories = extractSection(cleaned, ['Local Legends & Traditions', 'Story, History & Culture', 'Local Stories'], ['Main Characters', 'Local Characters']);
  const npcs = extractSection(cleaned, ['Local Characters / NPCs', 'Main Characters & NPCs'], ['Elements & Hidden Features', 'Hidden Game Elements']);
  const hidden = extractSection(cleaned, ['Hidden Game Elements', 'Elements & Hidden Features'], []);

  const title = firstUsefulLine(gameTitle) || titleFromSummary(summary) || 'Filadelfia field research game';
  const gameplayMechanics = mechanics || inferMechanicFromText(cleaned);
  const learningGoal = joinSentences([summary, pillars]) || 'Players explore a local issue through choices, visible consequences, and group reflection.';

  return {
    gameTitle: title,
    executiveSummary: summary,
    experiencePillars: pillars,
    targetAudience: audience || 'Young people in an Erasmus+ youth work context.',
    platforms: platform || 'Board, cards, tokens, dice or action markers, and field research notes.',
    gameplayMechanics,
    playerGoals: goals || 'Players win by completing the mission and explaining what their choices changed.',
    obstacles,
    interface: gameInterface,
    settingGenre: setting,
    places,
    localStories: stories,
    npcs,
    hiddenElements: hidden,
    learningGoal,
    debriefQuestion: 'Which local element, character, or obstacle changed your choices, and what does it teach us about community life?',
    playtestPlan: 'Test one 10-minute round with another team. Watch where rules are unclear, which choices create discussion, and whether every player has a meaningful action.',
  };
}

function emptyPrototypeMap(): PrototypeFieldMap {
  return Object.fromEntries(prototypeSteps.map((step) => [step.id, ''])) as PrototypeFieldMap;
}

function parseJsonFieldMap(answer: string): PrototypeFieldMap | null {
  const candidate = answer.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) return null;
  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    const normalized = normalizePrototypeMap(parsed);
    return Object.fromEntries(prototypeSteps.map((step) => [step.id, normalized[step.id] ?? ''])) as PrototypeFieldMap;
  } catch {
    return null;
  }
}

function normalizePrototypeMap(source: Record<string, unknown>): PrototypeFieldMap {
  const normalized = emptyPrototypeMap();
  prototypeSteps.forEach((step) => {
    const direct = source[step.id];
    if (typeof direct === 'string') {
      normalized[step.id] = direct;
      return;
    }
    const legacyKeys = legacyPrototypeFieldMap[step.id] ?? [];
    const legacyValue = legacyKeys.map((key) => source[key]).find((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (legacyValue) normalized[step.id] = legacyValue;
  });
  return normalized;
}

function getPrototypeFieldValue(prototype: Record<string, string>, id: string) {
  const direct = prototype[id]?.trim();
  if (direct) return direct;
  const legacyKeys = legacyPrototypeFieldMap[id] ?? [];
  return legacyKeys.map((key) => prototype[key]?.trim()).find(Boolean) ?? '';
}

function removeTemplateNoise(value: string) {
  const templatePhrases = [
    '[Insert Title Here]',
    'Write one or two sentences explaining the basic idea of the game.',
    'What do you want the player(s) to experience',
    'Who is the game for, primarily?',
    'What kind of game pieces will the players be using?',
    'How do players win?',
    'Other players? NPCs? The nature of the world?',
    'When a player uses their abilities',
    'When and where does it take place?',
  ];
  return templatePhrases.reduce((text, phrase) => text.replaceAll(phrase, ''), value);
}

function extractSection(source: string, headings: string[], nextHeadings: string[]) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => headings.some((heading) => normalize(line).includes(normalize(heading))));
  if (start < 0) return '';
  const end = nextHeadings.length
    ? lines.findIndex((line, index) => index > start && nextHeadings.some((heading) => normalize(line).includes(normalize(heading))))
    : -1;
  return sanitizeExtract((end > start ? lines.slice(start + 1, end) : lines.slice(start + 1)).join('\n'));
}

function sanitizeExtract(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^#+\s*/, '').replace(/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+$/, '').trim())
    .filter((line) => line && !/^[-| ]+$/.test(line))
    .join('\n')
    .trim();
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function firstUsefulLine(value: string) {
  return value.split(/\r?\n/).map((line) => line.replace(/[*_[\]]/g, '').trim()).find((line) => line.length > 2 && !line.includes('|')) || '';
}

function titleFromSummary(value: string) {
  const first = value.split(/[.!?]/).map((item) => item.trim()).find(Boolean);
  return first ? trimTo(first, 70) : '';
}

function inferMechanicFromText(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes('card')) return 'Players draw or place cards, make a choice, and resolve the visible consequence with tokens or movement.';
  if (lower.includes('route') || lower.includes('map')) return 'Players move through a route on the board, meet local elements, and solve missions with limited resources.';
  if (lower.includes('npc') || lower.includes('character')) return 'Players interact with NPC cards, accept missions, and use resources to overcome obstacles.';
  return 'Players choose an action, use a card or token, face an obstacle, and receive visible feedback from the board.';
}

function joinSentences(parts: string[]) {
  return parts.map((part) => part.trim()).filter(Boolean).join('\n\n');
}

function trimTo(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
