import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, type DocumentData } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadString } from 'firebase/storage';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { Download, FileJson, FileText, ImageIcon, LibraryBig, LogIn, LogOut, Pencil, Save, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import { courseInfo } from '../data/course';
import { getFirebaseClientServices, PLAYGROUND_ADMIN_EMAIL, type FirebaseClientServices } from '../lib/firebaseClient';
import { useStore, type GameAttachment, type PlaygroundGame, type PlaygroundGameField, type PlaygroundGameSection, type PrototypeImageSource } from '../store/useStore';

const courseLogoPath = `${import.meta.env.BASE_URL}arte-diem-course-logos.png`;
const erasmusLogoPath = `${import.meta.env.BASE_URL}erasmus-plus-small.png`;
type PdfDocument = InstanceType<typeof import('jspdf').jsPDF>;

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

  const updatePublishedGame = async (game: PlaygroundGame) => {
    if (!services || !isAdmin) {
      setStatus('Only the Playground admin can edit games.');
      return;
    }

    const updatedGame = {
      ...game,
      title: game.title.trim() || 'Untitled game',
      summary: game.summary.trim(),
      sourceFileName: game.sourceFileName.trim(),
      fields: normalizeFields(game.fields),
      sections: syncSectionsWithFields(game.sections, normalizeFields(game.fields)),
    };

    setBusy(true);
    await setDoc(doc(services.db, 'playgroundGames', updatedGame.slug), {
      ...playgroundGameToFirestore(updatedGame),
      updatedAt: serverTimestamp(),
      updatedBy: user?.email ?? '',
    }, { merge: true });
    savePlaygroundGames([updatedGame]);
    setStatus(`${updatedGame.title} updated in the public Playground library.`);
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

  const downloadGamePdf = async (game: PlaygroundGame) => {
    setBusy(true);
    setStatus(`Preparing final PDF for ${game.title}...`);
    try {
      const blob = await buildPlaygroundGamePdf(game);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${slugify(game.title || game.slug || 'playground-game')}-final.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      setStatus(`${game.title} final PDF downloaded.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create this PDF.');
    } finally {
      setBusy(false);
    }
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
              Everyone can view the library. Only the Arte Diem Calabria team can upload new games or manage the library.
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
              onSave={(updatedGame) => void updatePublishedGame(updatedGame)}
              onDownloadPdf={() => void downloadGamePdf(game)}
            />
          ))}
        </section>
      )}
    </motion.div>
  );
}

function PlaygroundGameCard({
  game,
  isAdmin,
  busy,
  onRemove,
  onSave,
  onDownloadPdf,
}: {
  key?: string;
  game: PlaygroundGame;
  isAdmin: boolean;
  busy: boolean;
  onRemove: () => void;
  onSave: (game: PlaygroundGame) => void;
  onDownloadPdf: () => void;
}) {
  const visibleSections = safeSections(game).filter((section) => section.fields.length);
  const firstFields = Object.entries(game.fields ?? {}).slice(0, 6);
  const attachments = safeAttachments(game);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(game.title);
  const [draftSummary, setDraftSummary] = useState(game.summary);
  const [draftSourceFileName, setDraftSourceFileName] = useState(game.sourceFileName);
  const [draftFields, setDraftFields] = useState<Record<string, string>>(game.fields ?? {});

  useEffect(() => {
    if (editing) return;
    setDraftTitle(game.title);
    setDraftSummary(game.summary);
    setDraftSourceFileName(game.sourceFileName);
    setDraftFields(game.fields ?? {});
  }, [editing, game]);

  const startEditing = () => {
    setDraftTitle(game.title);
    setDraftSummary(game.summary);
    setDraftSourceFileName(game.sourceFileName);
    setDraftFields(game.fields ?? {});
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraftTitle(game.title);
    setDraftSummary(game.summary);
    setDraftSourceFileName(game.sourceFileName);
    setDraftFields(game.fields ?? {});
    setEditing(false);
  };

  const saveEditing = () => {
    onSave({
      ...game,
      title: draftTitle,
      summary: draftSummary,
      sourceFileName: draftSourceFileName,
      fields: draftFields,
      sections: syncSectionsWithFields(game.sections, draftFields),
    });
    setEditing(false);
  };

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
              {editing ? (
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-300">Source file</span>
                    <input
                      value={draftSourceFileName}
                      onChange={(event) => setDraftSourceFileName(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-300"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-300">Game title</span>
                    <input
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-base font-black text-white outline-none focus:border-cyan-300"
                    />
                  </label>
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-300">{game.sourceFileName || 'Playground JSON'}</p>
                  <h2 className="mt-2 break-words text-xl font-arcade text-white">{game.title}</h2>
                </>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {!editing && (
                <button
                  onClick={onDownloadPdf}
                  disabled={busy}
                  className="rounded-lg border border-green-300/30 bg-green-300/10 p-2 text-green-100 transition-colors hover:bg-green-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                  title="Download final PDF"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
              {isAdmin && (
                editing ? (
                  <>
                    <button
                      onClick={saveEditing}
                      disabled={busy}
                      className="rounded-lg border border-green-300/30 bg-green-300/10 p-2 text-green-100 transition-colors hover:bg-green-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                      title="Save changes"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={busy}
                      className="rounded-lg border border-white/20 bg-white/[.05] p-2 text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                      title="Cancel edit"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startEditing}
                      disabled={busy}
                      className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 p-2 text-cyan-100 transition-colors hover:bg-cyan-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                      title="Edit game details"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={onRemove}
                      disabled={busy}
                      className="rounded-lg border border-red-300/30 bg-red-300/10 p-2 text-red-100 transition-colors hover:bg-red-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                      title="Delete from public library"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )
              )}
            </div>
          </div>
          {editing ? (
            <label className="mt-3 block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Summary</span>
              <textarea
                value={draftSummary}
                onChange={(event) => setDraftSummary(event.target.value)}
                rows={4}
                className="mt-1 w-full resize-y rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-sm leading-relaxed text-white outline-none focus:border-cyan-300"
              />
            </label>
          ) : (
            <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-300">{game.summary || 'No summary provided.'}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">{Object.keys(game.fields ?? {}).length} fields</span>
            <span className="rounded-full border border-pink-300/30 bg-pink-300/10 px-2.5 py-1 text-pink-100">{visibleSections.length} sections</span>
            {(game.disabledFieldIds ?? []).length > 0 && <span className="rounded-full border border-gray-300/20 bg-white/[.04] px-2.5 py-1 text-gray-300">{game.disabledFieldIds.length} hidden</span>}
            {attachments.length > 0 && <span className="rounded-full border border-green-300/30 bg-green-300/10 px-2.5 py-1 text-green-100">{attachments.length} attachments</span>}
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Edit Game Details</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-300">Fix text mistakes in the published JSON data. Image and attachment files stay unchanged.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveEditing}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg border border-green-300/40 bg-green-300/10 px-3 py-2 text-xs font-bold uppercase text-green-100 hover:bg-green-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={cancelEditing}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/[.05] px-3 py-2 text-xs font-bold uppercase text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {Object.entries(draftFields).map(([id, value]) => {
              const fieldValue = String(value);
              return (
              <label key={id} className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{fieldLabelFromId(id)}</span>
                <textarea
                  value={fieldValue}
                  onChange={(event) => setDraftFields((fields) => ({ ...fields, [id]: event.target.value }))}
                  rows={Math.min(8, Math.max(2, Math.ceil(fieldValue.length / 90)))}
                  className="mt-1 w-full resize-y rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-sm leading-relaxed text-white outline-none focus:border-cyan-300"
                />
              </label>
            );})}
          </div>
        </div>
      )}

      {!editing && firstFields.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {firstFields.map(([id, value]) => (
            <div key={id} className="notebook-muted-card rounded-lg border border-white/10 bg-black/35 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{fieldLabelFromId(id)}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-gray-200">{value}</p>
            </div>
          ))}
        </div>
      )}

      {!editing && attachments.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.dataUrl}
              download={attachment.name}
              className="notebook-muted-card flex min-w-0 items-center justify-between gap-3 rounded-lg border border-green-300/20 bg-green-300/10 p-3 text-left transition-colors hover:border-green-300 hover:bg-green-300/20"
            >
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-start gap-2 text-sm font-bold leading-snug text-white">
                  <FileText className="h-4 w-4 shrink-0 text-green-200" />
                  <span className="min-w-0 break-all [overflow-wrap:anywhere]">{attachment.name}</span>
                </span>
                <span className="mt-1 block min-w-0 break-words text-[10px] font-bold uppercase tracking-widest text-gray-400">{formatFileSize(attachment.size)} - {attachment.type || 'file'}</span>
              </span>
              <Download className="h-4 w-4 shrink-0 text-green-200" />
            </a>
          ))}
        </div>
      )}

      {!editing && visibleSections.length > 0 && (
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

async function buildPlaygroundGamePdf(game: PlaygroundGame) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const [erasmusLogo, courseLogo, gameImage] = await Promise.all([
    imageToDataUrl(erasmusLogoPath).catch(() => ''),
    imageToDataUrl(courseLogoPath).catch(() => ''),
    game.imageDataUrl ? imageToDataUrl(game.imageDataUrl).catch(() => '') : Promise.resolve(''),
  ]);
  const title = cleanPdfText(game.title).trim() || 'Untitled board game';
  const attachments = safeAttachments(game);
  let y = drawPlaygroundPdfHeader(pdf, title, erasmusLogo, courseLogo);

  if (gameImage) {
    y = ensurePlaygroundPdfSpace(pdf, y, 102, title, erasmusLogo, courseLogo);
    y = drawPlaygroundPdfSectionTitle(pdf, 'Board Game Image', y);
    y += 3;
    y = drawPdfImageContain(pdf, gameImage, 16, y, 178, 88) + 8;
  }

  if (attachments.length > 0) {
    y = ensurePlaygroundPdfSpace(pdf, y, 24, title, erasmusLogo, courseLogo);
    y = drawPlaygroundPdfSectionTitle(pdf, 'Game Attachments', y);
    attachments.forEach((attachment) => {
      y = drawPlaygroundPdfField(pdf, attachment.name, `${formatFileSize(attachment.size)} - ${attachment.type || 'file'}`, y, title, erasmusLogo, courseLogo);
    });
  }

  y = drawPlaygroundPdfSectionTitle(pdf, 'Prototype Sheet', y);
  if (game.summary) {
    y = drawPlaygroundPdfField(pdf, 'Executive Summary', game.summary, y, title, erasmusLogo, courseLogo);
  }

  const sections = safeSections(game).length ? safeSections(game) : normalizeSections(undefined, game.fields ?? {});
  sections.forEach((section) => {
    const fields = section.fields.filter((field) => field.value?.trim());
    if (!fields.length) return;
    y = ensurePlaygroundPdfSpace(pdf, y, 24, title, erasmusLogo, courseLogo);
    y = drawPlaygroundPdfSectionTitle(pdf, section.title, y);
    fields.forEach((field) => {
      y = drawPlaygroundPdfField(pdf, field.label || fieldLabelFromId(field.id), field.value, y, title, erasmusLogo, courseLogo);
    });
  });

  drawPlaygroundPdfFooter(pdf);
  return pdf.output('blob');
}

function drawPlaygroundPdfHeader(pdf: PdfDocument, gameTitle: string, erasmusLogo: string, courseLogo: string) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(255, 250, 240);
  pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), 'F');
  pdf.setFillColor(244, 237, 223);
  pdf.rect(0, 0, pageWidth, 46, 'F');
  if (erasmusLogo) drawPdfImageContain(pdf, erasmusLogo, pageWidth - 62, 9, 46, 14);
  if (courseLogo) drawPdfImageContain(pdf, courseLogo, pageWidth - 96, 25, 80, 14, 'right');

  pdf.setTextColor(32, 26, 18);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(20);
  pdf.text(courseInfo.title, 16, 16, { maxWidth: pageWidth - 122 });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(49, 95, 115);
  pdf.text(courseInfo.programme, 16, 25);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(102, 93, 80);
  pdf.text(`${courseInfo.dates} | ${courseInfo.venue} | Project code ${courseInfo.code}`, 16, 32, { maxWidth: pageWidth - 122 });
  pdf.setTextColor(124, 75, 31);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(gameTitle, 16, 41, { maxWidth: pageWidth - 122 });
  return 58;
}

function drawPlaygroundPdfSectionTitle(pdf: PdfDocument, title: string, y: number) {
  pdf.setFillColor(248, 239, 216);
  pdf.setDrawColor(207, 197, 179);
  pdf.roundedRect(16, y, 178, 12, 2.5, 2.5, 'FD');
  pdf.setTextColor(124, 75, 31);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(title.toUpperCase(), 20, y + 8);
  return y + 16;
}

function drawPlaygroundPdfField(
  pdf: PdfDocument,
  label: string,
  value: string,
  y: number,
  gameTitle: string,
  erasmusLogo: string,
  courseLogo: string,
) {
  const text = cleanPdfText(value).trim() || 'To complete';
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - 40;
  const lines = pdf.splitTextToSize(softWrapLongWords(text, 46), maxWidth);
  const lineHeight = 4.8;
  let remainingLines = [...lines];
  let isFirstBlock = true;

  while (remainingLines.length) {
    y = ensurePlaygroundPdfSpace(pdf, y, 24, gameTitle, erasmusLogo, courseLogo);
    const availableHeight = Math.max(24, pageHeight - 23 - y);
    const headerHeight = isFirstBlock ? 13 : 8;
    const maxLines = Math.max(1, Math.floor((availableHeight - headerHeight - 5) / lineHeight));
    const pageLines = remainingLines.slice(0, maxLines);
    remainingLines = remainingLines.slice(pageLines.length);
    const blockHeight = Math.min(availableHeight, Math.max(20, headerHeight + pageLines.length * lineHeight + 5));

    pdf.setDrawColor(216, 206, 189);
    pdf.setFillColor(255, 253, 248);
    pdf.roundedRect(16, y, 178, blockHeight, 2.5, 2.5, 'FD');
    pdf.setTextColor(123, 113, 100);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text(isFirstBlock ? label.toUpperCase() : `${label.toUpperCase()} (CONTINUED)`, 20, y + 7);
    pdf.setTextColor(32, 26, 18);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.text(pageLines, 20, y + headerHeight, { maxWidth });
    y += blockHeight + 5;
    isFirstBlock = false;
  }

  return y;
}

function ensurePlaygroundPdfSpace(pdf: PdfDocument, y: number, needed: number, gameTitle: string, erasmusLogo: string, courseLogo: string) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - 18) return y;
  drawPlaygroundPdfFooter(pdf);
  pdf.addPage();
  return drawPlaygroundPdfHeader(pdf, gameTitle, erasmusLogo, courseLogo);
}

function drawPlaygroundPdfFooter(pdf: PdfDocument) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setDrawColor(215, 205, 187);
  pdf.line(16, pageHeight - 13, pageWidth - 16, pageHeight - 13);
  pdf.setTextColor(102, 93, 80);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text('Generated inside the Games Are No Joke Companion App.', 16, pageHeight - 7);
  pdf.text(`Hosted by ${courseInfo.host}`, pageWidth - 16, pageHeight - 7, { align: 'right' });
}

function drawPdfImageContain(pdf: PdfDocument, imageDataUrl: string, x: number, y: number, maxWidth: number, maxHeight: number, align: 'center' | 'right' = 'center') {
  const properties = pdf.getImageProperties(imageDataUrl);
  const imageWidth = properties.width || maxWidth;
  const imageHeight = properties.height || maxHeight;
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const offsetX = align === 'right' ? maxWidth - width : align === 'center' ? (maxWidth - width) / 2 : 0;
  const format = imageDataUrl.startsWith('data:image/jpeg') || imageDataUrl.startsWith('data:image/jpg') ? 'JPEG' : 'PNG';
  pdf.addImage(imageDataUrl, format, x + offsetX, y + (maxHeight - height) / 2, width, height);
  return y + maxHeight;
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

function syncSectionsWithFields(sections: PlaygroundGameSection[], fields: Record<string, string>) {
  const normalizedFields = normalizeFields(fields);
  const syncedSections = safePlainSections(sections)
    .map((section) => ({
      ...section,
      fields: section.fields
        .map((field) => ({
          ...field,
          value: normalizedFields[field.id] ?? field.value,
        }))
        .filter((field) => field.value.trim()),
    }))
    .filter((section) => section.fields.length);

  if (syncedSections.length) return syncedSections;
  return normalizeSections(undefined, normalizedFields);
}

function safePlainSections(sections: PlaygroundGameSection[]) {
  return Array.isArray(sections) ? sections : [];
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

function cleanPdfText(value: string) {
  return value
    .replace(/\r/g, '')
    .replace(/[\u{1f300}-\u{1faff}]/gu, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function softWrapLongWords(value: string, maxLength: number) {
  return value
    .split(/(\s+)/)
    .map((part) => {
      if (part.length <= maxLength || /\s+/.test(part)) return part;
      const chunks: string[] = [];
      for (let index = 0; index < part.length; index += maxLength) {
        chunks.push(part.slice(index, index + maxLength));
      }
      return chunks.join(' ');
    })
    .join('');
}

async function imageToDataUrl(url: string) {
  if (url.startsWith('data:image/')) return url;
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
