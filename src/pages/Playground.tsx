import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, type DocumentData } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadString } from 'firebase/storage';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { Download, FileJson, FileText, ImageIcon, LibraryBig, LogIn, LogOut, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { courseInfo } from '../data/course';
import { getFirebaseClientServices, PLAYGROUND_ADMIN_EMAIL, type FirebaseClientServices } from '../lib/firebaseClient';
import { useStore, type GameAttachment, type PlaygroundGame, type PlaygroundGameField, type PlaygroundGameSection, type PrototypeImageSource } from '../store/useStore';

type PlaygroundExportPackage = {
  schemaVersion?: number;
  exportedAt?: string;
  game?: {
    slug?: string;
    title?: string;
    summary?: string;
    imageDataUrl?: string;
    imageSource?: PrototypeImageSource;
    attachments?: GameAttachment[];
    sections?: PlaygroundGameSection[];
    fields?: Record<string, string>;
  };
  disabledFieldIds?: string[];
  source?: {
    gddFileName?: string | null;
  };
};

export default function Playground() {
  const { playgroundGames, savePlaygroundGames, removePlaygroundGame } = useStore();
  const localFallbackGames = useMemo(() => normalizeStoredGames(playgroundGames), [playgroundGames]);
  const [libraryGames, setLibraryGames] = useState<PlaygroundGame[]>(localFallbackGames);
  const [services, setServices] = useState<FirebaseClientServices | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [remoteReady, setRemoteReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const isAdmin = user?.email?.toLowerCase() === PLAYGROUND_ADMIN_EMAIL;
  const totalFields = useMemo(
    () => libraryGames.reduce((sum, game) => sum + Object.keys(game.fields ?? {}).length, 0),
    [libraryGames],
  );

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeGames: (() => void) | undefined;
    let active = true;

    getFirebaseClientServices()
      .then((firebaseServices) => {
        if (!active) return;
        setServices(firebaseServices);
        unsubscribeAuth = onAuthStateChanged(firebaseServices.auth, setUser);
        const gamesQuery = query(collection(firebaseServices.db, 'playgroundGames'), orderBy('updatedAt', 'desc'));
        unsubscribeGames = onSnapshot(
          gamesQuery,
          (snapshot) => {
            const games = snapshot.docs
              .map((gameDoc) => playgroundGameFromFirestore(gameDoc.id, gameDoc.data()))
              .filter((game): game is PlaygroundGame => Boolean(game));
            setLibraryGames(games);
            setRemoteReady(true);
            if (!games.length) {
              setStatus('The public Playground library is ready. No games have been published yet.');
            } else {
              setStatus('');
            }
          },
          (error) => {
            setRemoteReady(false);
            setLibraryGames(localFallbackGames);
            setStatus(`Could not load the public Playground library. Showing this browser's saved games only. ${error.message}`);
          },
        );
      })
      .catch((error) => {
        setRemoteReady(false);
        setLibraryGames(localFallbackGames);
        setStatus(error instanceof Error ? error.message : 'Firebase could not start. Showing this browser only.');
      });

    return () => {
      active = false;
      unsubscribeAuth?.();
      unsubscribeGames?.();
    };
  }, [localFallbackGames]);

  const loginWithGoogle = async () => {
    if (!services) {
      setStatus('Firebase is still loading. Try again in a moment.');
      return;
    }
    try {
      await signInWithPopup(services.auth, services.googleProvider);
    } catch (error) {
      setStatus(formatGoogleLoginError(error));
    }
  };

  const logout = async () => {
    if (!services) return;
    await signOut(services.auth);
  };

  const importJsonFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!services || !isAdmin) {
      setStatus('Only the Playground admin can publish games.');
      return;
    }

    setBusy(true);
    setStatus('Publishing Playground JSON files...');
    const imported: PlaygroundGame[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        const game = normalizePlaygroundGame(parsed, file.name);
        const publishedGame = await uploadGameAssets(services, game);
        await setDoc(doc(services.db, 'playgroundGames', publishedGame.slug), {
          ...playgroundGameToFirestore(publishedGame),
          updatedAt: serverTimestamp(),
          publishedAt: serverTimestamp(),
          publishedBy: user?.email ?? '',
        }, { merge: true });
        imported.push(publishedGame);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid JSON file.';
        errors.push(`${file.name}: ${message}`);
      }
    }

    if (imported.length) {
      savePlaygroundGames(imported);
    }

    const importedText = imported.length === 1 ? '1 game published.' : `${imported.length} games published.`;
    setStatus(errors.length ? `${importedText} Problems: ${errors.join(' ')}` : importedText);
    setBusy(false);
  };

  const deletePublishedGame = async (game: PlaygroundGame) => {
    if (!services || !isAdmin) {
      setStatus('Only the Playground admin can delete games.');
      return;
    }
    if (!window.confirm(`Delete "${game.title}" from the public Playground library?`)) return;

    setBusy(true);
    await Promise.allSettled([
      safeDeleteStoragePath(services, game.imageStoragePath),
      ...safeAttachments(game).map((attachment) => safeDeleteStoragePath(services, attachment.storagePath)),
    ]);
    await deleteDoc(doc(services.db, 'playgroundGames', game.slug));
    removePlaygroundGame(game.id);
    setStatus(`${game.title} deleted from the public Playground library.`);
    setBusy(false);
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
      games: libraryGames,
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
              Explore the board games created during the course. The public library is shared through Firebase, so games published by the admin are visible to everyone.
            </p>
          </div>
          <div className="notebook-card rounded-xl border border-green-300/30 bg-black/55 p-4">
            <LibraryBig className="h-9 w-9 text-green-300" />
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-gray-400">{libraryGames.length} games</p>
            <p className="mt-1 text-xs text-gray-500">{totalFields} enabled fields loaded</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-cyan-200">{remoteReady ? 'Public library online' : 'Browser fallback'}</p>
          </div>
        </div>
      </section>

      <section className="notebook-surface arcade-border glass-panel rounded-xl p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Admin Access</p>
            <h2 className="mt-2 text-xl font-arcade text-white">Google Login</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              Everyone can view the library. Only {PLAYGROUND_ADMIN_EMAIL} can upload or delete games.
            </p>
            {user && (
              <p className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-widest ${isAdmin ? 'border-green-300/30 bg-green-300/10 text-green-100' : 'border-yellow-300/30 bg-yellow-300/10 text-yellow-100'}`}>
                <ShieldCheck className="h-4 w-4" />
                {isAdmin ? 'Admin signed in' : `Signed in as ${user.email ?? 'Google user'} - view only`}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {user ? (
              <button
                onClick={() => void logout()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/[.05] px-4 py-3 text-xs font-bold uppercase text-white transition-colors hover:bg-white hover:text-black"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => void loginWithGoogle()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-4 py-3 text-xs font-bold uppercase text-cyan-100 transition-colors hover:bg-cyan-300 hover:text-black"
              >
                <LogIn className="h-4 w-4" />
                Sign In With Google
              </button>
            )}
            <button
              onClick={exportLibraryJson}
              disabled={!libraryGames.length}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-green-300/40 bg-green-300/10 px-4 py-3 text-xs font-bold uppercase text-green-100 transition-colors hover:bg-green-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Export Library
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-5 rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Publish Games</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-200">
                  Upload one or more Playground JSON files exported from Prototype Lab. They publish immediately.
                </p>
              </div>
              <label className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-4 py-3 text-xs font-bold uppercase text-cyan-100 transition-colors hover:bg-cyan-300 hover:text-black ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                <Upload className="h-4 w-4" />
                Upload JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  multiple
                  className="sr-only"
                  disabled={busy}
                  onChange={(event) => {
                    void importJsonFiles(event.target.files);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {status && <p className="mt-4 rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-yellow-100">{status}</p>}
      </section>

      {libraryGames.length === 0 ? (
        <section className="reading-panel p-6 text-center">
          <FileJson className="mx-auto h-10 w-10 text-cyan-300" />
          <h2 className="mt-4 text-lg font-arcade text-white">No Games Published Yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-300">
            When the admin publishes Prototype JSON files, the games will appear here for everyone.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {libraryGames.map((game) => (
            <PlaygroundGameCard
              key={game.id}
              game={game}
              isAdmin={isAdmin}
              busy={busy}
              onRemove={() => void deletePublishedGame(game)}
            />
          ))}
        </section>
      )}
    </motion.div>
  );
}

function PlaygroundGameCard({ game, isAdmin, busy, onRemove }: { key?: string; game: PlaygroundGame; isAdmin: boolean; busy: boolean; onRemove: () => void }) {
  const visibleSections = safeSections(game).filter((section) => section.fields.length);
  const firstFields = Object.entries(game.fields ?? {}).slice(0, 6);
  const attachments = safeAttachments(game);

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
            {isAdmin && (
              <button
                onClick={onRemove}
                disabled={busy}
                className="rounded-lg border border-red-300/30 bg-red-300/10 p-2 text-red-100 transition-colors hover:bg-red-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                title="Delete from public library"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-300">{game.summary || 'No summary provided.'}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">{Object.keys(game.fields ?? {}).length} fields</span>
            <span className="rounded-full border border-pink-300/30 bg-pink-300/10 px-2.5 py-1 text-pink-100">{visibleSections.length} sections</span>
            {(game.disabledFieldIds ?? []).length > 0 && <span className="rounded-full border border-gray-300/20 bg-white/[.04] px-2.5 py-1 text-gray-300">{game.disabledFieldIds.length} hidden</span>}
            {attachments.length > 0 && <span className="rounded-full border border-green-300/30 bg-green-300/10 px-2.5 py-1 text-green-100">{attachments.length} attachments</span>}
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

      {attachments.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.dataUrl}
              download={attachment.name}
              className="notebook-muted-card flex items-center justify-between gap-3 rounded-lg border border-green-300/20 bg-green-300/10 p-3 text-left transition-colors hover:border-green-300 hover:bg-green-300/20"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 break-words text-sm font-bold text-white">
                  <FileText className="h-4 w-4 shrink-0 text-green-200" />
                  {attachment.name}
                </span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">{formatFileSize(attachment.size)} - {attachment.type || 'file'}</span>
              </span>
              <Download className="h-4 w-4 shrink-0 text-green-200" />
            </a>
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

async function uploadGameAssets(services: FirebaseClientServices, game: PlaygroundGame): Promise<PlaygroundGame> {
  const slug = slugify(game.slug || game.title);
  let imageDataUrl = game.imageDataUrl;
  let imageStoragePath = game.imageStoragePath;

  if (imageDataUrl?.startsWith('data:')) {
    const imageType = dataUrlMimeType(imageDataUrl) || 'image/png';
    imageStoragePath = `playground/${slug}/box-image.${extensionFromMime(imageType, 'png')}`;
    imageDataUrl = await uploadDataUrl(services, imageStoragePath, imageDataUrl, imageType);
  }

  const attachments = await Promise.all(safeAttachments(game).map(async (attachment, index) => {
    if (!attachment.dataUrl.startsWith('data:')) return attachment;
    const contentType = dataUrlMimeType(attachment.dataUrl) || attachment.type || 'application/octet-stream';
    const storagePath = `playground/${slug}/attachments/${String(index + 1).padStart(2, '0')}-${sanitizeFileName(attachment.name)}`;
    const downloadUrl = await uploadDataUrl(services, storagePath, attachment.dataUrl, contentType);
    return {
      ...attachment,
      dataUrl: downloadUrl,
      storagePath,
      type: contentType,
    };
  }));

  return {
    ...game,
    id: slug,
    slug,
    imageDataUrl,
    imageStoragePath,
    attachments,
    importedAt: new Date().toISOString(),
  };
}

async function uploadDataUrl(services: FirebaseClientServices, storagePath: string, dataUrl: string, contentType: string) {
  const fileRef = ref(services.storage, storagePath);
  await uploadString(fileRef, dataUrl, 'data_url', { contentType });
  return await getDownloadURL(fileRef);
}

async function safeDeleteStoragePath(services: FirebaseClientServices, storagePath: string | undefined) {
  if (!storagePath) return;
  await deleteObject(ref(services.storage, storagePath));
}

function playgroundGameToFirestore(game: PlaygroundGame) {
  return stripUndefined({
    id: game.id,
    slug: game.slug,
    title: game.title,
    summary: game.summary,
    imageDataUrl: game.imageDataUrl,
    imageSource: game.imageSource,
    imageStoragePath: game.imageStoragePath,
    attachments: safeAttachments(game),
    sections: safeSections(game),
    fields: game.fields ?? {},
    disabledFieldIds: game.disabledFieldIds ?? [],
    sourceFileName: game.sourceFileName,
    importedAt: game.importedAt,
    exportedAt: game.exportedAt,
  });
}

function playgroundGameFromFirestore(id: string, data: DocumentData): PlaygroundGame | null {
  if (!data || typeof data !== 'object') return null;
  const title = stringValue(data.title) || 'Untitled game';
  const slug = stringValue(data.slug) || slugify(title) || id;
  return {
    id: stringValue(data.id) || slug,
    slug,
    title,
    summary: stringValue(data.summary),
    imageDataUrl: stringValue(data.imageDataUrl),
    imageSource: data.imageSource === 'generated' || data.imageSource === 'uploaded' ? data.imageSource : 'none',
    imageStoragePath: stringValue(data.imageStoragePath) || undefined,
    attachments: normalizeAttachments(data.attachments),
    sections: normalizeSections(data.sections, normalizeFields(data.fields)),
    fields: normalizeFields(data.fields),
    disabledFieldIds: Array.isArray(data.disabledFieldIds) ? data.disabledFieldIds.filter((item): item is string => typeof item === 'string') : [],
    sourceFileName: stringValue(data.sourceFileName),
    importedAt: stringValue(data.importedAt) || new Date().toISOString(),
    exportedAt: stringValue(data.exportedAt),
  };
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
    attachments: normalizeAttachments(rawGame.attachments),
    sections,
    fields,
    disabledFieldIds: Array.isArray(pkg.disabledFieldIds) ? pkg.disabledFieldIds.filter((item): item is string => typeof item === 'string') : [],
    sourceFileName: stringValue(pkg.source?.gddFileName) || sourceFileName,
    importedAt: new Date().toISOString(),
    exportedAt: stringValue(pkg.exportedAt),
  };
}

function normalizeStoredGames(games: PlaygroundGame[]) {
  return games.map((game) => ({
    ...game,
    fields: game.fields ?? {},
    attachments: safeAttachments(game),
    sections: safeSections(game),
    disabledFieldIds: game.disabledFieldIds ?? [],
  }));
}

function normalizeAttachments(value: unknown): GameAttachment[] {
  if (!Array.isArray(value)) return [];
  const attachments: Array<GameAttachment | null> = value
    .map((attachment) => {
      if (!isRecord(attachment)) return null;
      const name = stringValue(attachment.name);
      const dataUrl = stringValue(attachment.dataUrl);
      if (!name || !dataUrl) return null;
      return {
        id: stringValue(attachment.id) || slugify(name),
        name,
        type: stringValue(attachment.type) || 'application/octet-stream',
        size: typeof attachment.size === 'number' ? attachment.size : 0,
        dataUrl,
        uploadedAt: stringValue(attachment.uploadedAt) || new Date().toISOString(),
        storagePath: stringValue(attachment.storagePath) || undefined,
      } satisfies GameAttachment;
    });
  return attachments.filter((attachment): attachment is GameAttachment => Boolean(attachment));
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
      fields: Object.entries(fields).map(([fieldId, fieldValue]) => ({
        id: fieldId,
        label: fieldLabelFromId(fieldId),
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

function safeAttachments(game: PlaygroundGame) {
  return Array.isArray(game.attachments) ? game.attachments : [];
}

function safeSections(game: PlaygroundGame) {
  return Array.isArray(game.sections) ? game.sections : [];
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

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || `attachment-${Date.now()}`;
}

function dataUrlMimeType(value: string) {
  return /^data:([^;,]+)/.exec(value)?.[1];
}

function extensionFromMime(mimeType: string, fallback: string) {
  const extension = mimeType.split('/')[1]?.split('+')[0];
  return extension?.replace(/[^a-z0-9]/gi, '') || fallback;
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)]),
    ) as T;
  }
  return value;
}

function formatGoogleLoginError(error: unknown) {
  const code = isRecord(error) && typeof error.code === 'string' ? error.code : '';
  if (code === 'auth/unauthorized-domain') {
    return 'Google login is blocked for this domain. In Firebase Console, open Authentication > Settings > Authorized domains and add localhost plus 127.0.0.1 for local testing.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google login was closed before it finished.';
  }
  return error instanceof Error ? error.message : 'Google login failed.';
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
