import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { NavBar } from './components/NavBar';
import { courseInfo } from './data/course';
import { installAudioUnlock, playSound } from './lib/audio';
import { useStore } from './store/useStore';

const Home = lazy(() => import('./pages/Home'));
const Theory = lazy(() => import('./pages/Theory'));
const ArcadeList = lazy(() => import('./pages/ArcadeList'));
const Progress = lazy(() => import('./pages/Progress'));
const About = lazy(() => import('./pages/About'));
const Quiz = lazy(() => import('./pages/Quiz'));
const PrototypeLab = lazy(() => import('./pages/PrototypeLab'));
const GeminiCoach = lazy(() => import('./pages/GeminiCoach'));
const CastleRushGame = lazy(() => import('./pages/games/CastleRushGame'));
const YouthPassDropGame = lazy(() => import('./pages/games/YouthPassDropGame'));
const FiladelfiaStoryGame = lazy(() => import('./pages/games/FiladelfiaStoryGame'));
const FutureExchangeGame = lazy(() => import('./pages/games/FutureExchangeGame'));

const Router = import.meta.env.BASE_URL === '/' ? BrowserRouter : HashRouter;
const routerBasename = import.meta.env.BASE_URL === '/'
  ? undefined
  : import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  return (
    <Router basename={Router === BrowserRouter ? routerBasename : undefined}>
      <AppShell />
    </Router>
  );
}

function AppShell() {
  const location = useLocation();
  const firstRoute = useRef(true);
  const { audioEnabled, setAudioEnabled } = useStore();

  useEffect(() => {
    installAudioUnlock();
  }, []);

  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    playSound('nav', audioEnabled);
  }, [audioEnabled, location.pathname]);

  return (
      <div className="min-h-screen bg-arcade-bg scanlines crt-flicker flex flex-col items-center font-sans tracking-wide">
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-6xl mx-auto relative pb-36 px-3 sm:px-4 pt-4 sm:pt-6 flex flex-col gap-4 overflow-x-hidden">
          
          <header className="flex flex-col md:flex-row justify-between items-center bg-black/55 border border-pink-400/40 rounded-xl p-3 sm:p-4 mb-2 gap-3 shadow-[0_0_18px_rgba(255,0,255,.12)]">
            <Link to="/" className="flex flex-col">
              <h1 className="text-base sm:text-2xl md:text-3xl font-arcade mobile-readable-arcade text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">
                {courseInfo.title}
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-2 mt-2 tracking-widest font-bold uppercase">
                <span className="text-pink-500">●</span> {courseInfo.programme}
              </p>
            </Link>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-300">Hosted by <span className="text-arcade-green font-bold">{courseInfo.host}</span></p>
              <p className="text-[10px] text-gray-500 uppercase">{courseInfo.dates} - {courseInfo.venue}</p>
              <p className="text-[10px] text-cyan-400/80 uppercase mt-1">{courseInfo.code}</p>
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[10px] font-bold uppercase text-gray-200 hover:border-cyan-300"
              >
                {audioEnabled ? <Volume2 className="h-4 w-4 text-cyan-300" /> : <VolumeX className="h-4 w-4 text-gray-500" />}
                App Sound {audioEnabled ? 'On' : 'Off'}
              </button>
            </div>
          </header>

          <Suspense fallback={<div className="reading-panel p-6 text-sm font-bold text-cyan-200">Loading section...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/theory" element={<Theory />} />
              <Route path="/prototype" element={<PrototypeLab />} />
              <Route path="/coach" element={<GeminiCoach />} />
              <Route path="/arcade" element={<ArcadeList />} />
              <Route path="/arcade/castle-rush" element={<CastleRushGame />} />
              <Route path="/arcade/youthpass-drop" element={<YouthPassDropGame />} />
              <Route path="/arcade/filadelfia-story" element={<FiladelfiaStoryGame />} />
              <Route path="/arcade/future-exchange" element={<FutureExchangeGame />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/about" element={<About />} />
              <Route path="/quiz" element={<Quiz />} />
            </Routes>
          </Suspense>
        </main>

        <NavBar />
      </div>
  );
}
