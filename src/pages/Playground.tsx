import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Download, FileJson, ImageIcon, LibraryBig, Trash2, Upload } from 'lucide-react';
import { courseInfo } from '../data/course';
import { useStore, type PlaygroundGame, type PlaygroundGameField, type PlaygroundGameSection, type PrototypeImageSource } from '../store/useStore';

type PlaygroundExportPackage = {
  schemaVersion?: number;
  exportedAt?: string;
  game?: {
    slug?: string;
    title?: string;
    summary?: string;
    imageDataUrl?: string;
    imageSource?: PrototypeImageSource;
    sections?: PlaygroundGameSection[];
    fields?: Record<string, string>;
  };
  disabledFieldIds?: string[];
  source?: {
    gddFileName?: string | null;
  };
};

export default function Playground() {
  const { playgroundGames, savePlaygroundGames, removePlaygroundGame, clearPlaygroundGames } = useStore();
  const [status, setStatus] = useState('');
  const totalFields = useMemo(
    () => playgroundGames.reduce((sum, game) => sum + Object.keys(game.fields).length, 0),
    [playgroundGames],
  );

  const importJsonFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setStatus('Reading Playground JSON files...');

    const imported: PlaygroundGame[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        imported.push(normalizePlaygroundGame(parsed, file.name));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid JSON file.';
        errors.push(`${file.name}: ${message}`);
      }
    }

    if (imported.length) {
      savePlaygroundGames(imported);
    }

    const importedText = imported.length === 1 ? '1 game imported.' : `${imported.length} games imported.`;
    setStatus(errors.length ? `${importedText} Problems: ${errors.join(' ')}` : importedText);
  };

  const exportLibraryJson = () => {
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      course: {
        title: courseInfo.title,
        programme: courseInfo.programme,
        dates: courseInfo.dates,
        venue: courseInfo.venue,
      },
      games: playgroundGames,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `games-are-no-joke-playground-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus('Playground library JSON downloaded.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 space-y-4">
      <section className="notebook-surface arcade-border-green glass-panel-green rounded-xl p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-300">Playground Library</p>
            <h1 className="mt-3 text-2xl font-arcade text-white md:text-3xl">Games Created By Participants</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">
              Upload Playground JSON files exported from Prototype Lab. The games stay in this browser so the app admin can review the titles, images, rules, materials, learning goals, and debrief fields before building a public Playground section.
            </p>
          </div>
          <div className="notebook-card rounded-xl border border-green-300/30 bg-black/55 p-4">
            <LibraryBig className="h-9 w-9 text-green-300" />
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-gray-400">{playgroundGames.length} games</p>
            <p className="mt-1 text-xs text-gray-500">{totalFields} enabled fields loaded</p>
          </div>
        </div>
      </section>

      <section className="notebook-surface arcade-border glass-panel rounded-xl p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Admin Import</p>
            <h2 className="mt-2 text-xl font-arcade text-white">Upload Playground JSON</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              Use the JSON downloaded from Prototype Lab. You can upload one file or many files at once.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-4 py-3 text-xs font-bold uppercase text-cyan-100 transition-colors hover:bg-cyan-300 hover:text-black">
              <Upload className="h-4 w-4" />
              Upload JSON
              <input
                type="file"
                accept="application/json,.json"
                multiple
                className="sr-only"
                onChange={(event) => {
                  void importJsonFiles(event.target.files);
                  event.currentTarget.value = '';
                }}
              />
            </label>
            <button
              onClick={exportLibraryJson}
              disabled={!playgroundGames.length}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-green-300/40 bg-green-300/10 px-4 py-3 text-xs font-bold uppercase text-green-100 transition-colors hover:bg-green-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Export Library
            </button>
            <button
              onClick={() => {
                if (window.confirm('Remove all imported Playground games from this browser?')) clearPlaygroundGames();
              }}
              disabled={!playgroundGames.length}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-red-300/30 bg-red-300/10 px-4 py-3 text-xs font-bold uppercase text-red-100 transition-colors hover:bg-red-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
        {status && <p className="mt-4 rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-yellow-100">{status}</p>}
      </section>

      {playgroundGames.length === 0 ? (
        <section className="reading-panel p-6 text-center">
          <FileJson className="mx-auto h-10 w-10 text-cyan-300" />
          <h2 className="mt-4 text-lg font-arcade text-white">No Games Loaded Yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-300">
            Download JSON from Prototype Lab, then upload it here to build the admin Playground library.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {playgroundGames.map((game) => (
            <PlaygroundGameCard key={game.id} game={game} onRemove={() => removePlaygroundGame(game.id)} />
          ))}
        </section>
      )}
    </motion.div>
  );
}

function PlaygroundGameCard({ game, onRemove }: { key?: string; game: PlaygroundGame; onRemove: () => void }) {
  const visibleSections = game.sections.filter((section) => section.fields.length);
  const firstFields = Object.entries(game.fields).slice(0, 6);

  return (
    <article className="notebook-surface rounded-xl border border-white/10 bg-black/45 p-4">
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div className="min-h-36 overflow-hidden rounded-lg border border-white/10 bg-black/45">
          {game.imageDataUrl ? (
            <img src={game.imageDataUrl} alt={`${game.title} board game`} className="h-full min-h-36 w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-36 items-center justify-center">
              <ImageIcon className="h-9 w-9 text-gray-500" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-300">{game.sourceFileName || 'Playground JSON'}</p>
              <h2 className="mt-2 break-words text-xl font-arcade text-white">{game.title}</h2>
            </div>
            <button
              onClick={onRemove}
              className="rounded-lg border border-red-300/30 bg-red-300/10 p-2 text-red-100 transition-colors hover:bg-red-300 hover:text-black"
              title="Remove game"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-300">{game.summary || 'No summary provided.'}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">{Object.keys(game.fields).length} fields</span>
            <span className="rounded-full border border-pink-300/30 bg-pink-300/10 px-2.5 py-1 text-pink-100">{visibleSections.length} sections</span>
            {game.disabledFieldIds.length > 0 && <span className="rounded-full border border-gray-300/20 bg-white/[.04] px-2.5 py-1 text-gray-300">{game.disabledFieldIds.length} hidden</span>}
          </div>
        </div>
      </div>

      {firstFields.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {firstFields.map(([id, value]) => (
            <div key={id} className="notebook-muted-card rounded-lg border border-white/10 bg-black/35 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{fieldLabelFromId(id)}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-gray-200">{value}</p>
            </div>
          ))}
        </div>
      )}

      {visibleSections.length > 0 && (
        <details className="mt-4 notebook-muted-card rounded-lg border border-white/10 bg-black/35 p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-cyan-200">View full game data</summary>
          <div className="mt-3 space-y-4">
            {visibleSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-black uppercase tracking-widest text-green-300">{section.title}</h3>
                <div className="mt-2 space-y-2">
                  {section.fields.map((field) => (
                    <div key={field.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{field.label}</p>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-gray-200">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </article>
  );
}

function normalizePlaygroundGame(source: unknown, sourceFileName: string): PlaygroundGame {
  if (!isRecord(source)) throw new Error('The JSON root must be an object.');
  const pkg = source as PlaygroundExportPackage;
  const rawGame = isRecord(pkg.game) ? pkg.game : null;
  if (!rawGame) throw new Error('Missing game object. Export this file from Prototype Lab first.');

  const fields = normalizeFields(rawGame.fields);
  const title = stringValue(rawGame.title) || fields.gameTitle || titleFromFileName(sourceFileName);
  const slug = stringValue(rawGame.slug) || slugify(title);
  const sections = normalizeSections(rawGame.sections, fields);
  const imageSource = rawGame.imageSource === 'generated' || rawGame.imageSource === 'uploaded' ? rawGame.imageSource : 'none';

  return {
    id: slug,
    slug,
    title,
    summary: stringValue(rawGame.summary) || fields.executiveSummary || '',
    imageDataUrl: stringValue(rawGame.imageDataUrl),
    imageSource,
    sections,
    fields,
    disabledFieldIds: Array.isArray(pkg.disabledFieldIds) ? pkg.disabledFieldIds.filter((item): item is string => typeof item === 'string') : [],
    sourceFileName: stringValue(pkg.source?.gddFileName) || sourceFileName,
    importedAt: new Date().toISOString(),
    exportedAt: stringValue(pkg.exportedAt),
  };
}

function normalizeFields(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, fieldValue]) => [key, stringValue(fieldValue).trim()])
      .filter(([, fieldValue]) => Boolean(fieldValue)),
  );
}

function normalizeSections(value: unknown, fields: Record<string, string>): PlaygroundGameSection[] {
  if (Array.isArray(value)) {
    return value
      .map((section) => {
        if (!isRecord(section)) return null;
        const title = stringValue(section.title);
        const sectionFields = Array.isArray(section.fields)
          ? section.fields.map(normalizeField).filter((field): field is PlaygroundGameField => Boolean(field?.value))
          : [];
        return title && sectionFields.length ? { title, fields: sectionFields } : null;
      })
      .filter((section): section is PlaygroundGameSection => Boolean(section));
  }

  return [
    {
      title: 'Game Fields',
      fields: Object.entries(fields).map(([id, fieldValue]) => ({
        id,
        label: fieldLabelFromId(id),
        value: fieldValue,
      })),
    },
  ].filter((section) => section.fields.length);
}

function normalizeField(value: unknown): PlaygroundGameField | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id);
  const fieldValue = stringValue(value.value).trim();
  if (!id || !fieldValue) return null;
  return {
    id,
    label: stringValue(value.label) || fieldLabelFromId(id),
    value: fieldValue,
  };
}

function fieldLabelFromId(id: string) {
  return id
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function titleFromFileName(fileName: string) {
  return fileName.replace(/\.json$/i, '').replace(/[-_]+/g, ' ').trim() || 'Untitled game';
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `game-${Date.now()}`;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
