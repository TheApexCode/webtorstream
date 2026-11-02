import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Film,
  UploadCloud,
  Clipboard,
  Sparkles,
  Layers,
  History,
  Settings,
  HelpCircle,
  ExternalLink,
  Check,
  AlertCircle,
  ArrowRight,
  HardDrive,
  Clock,
  Radio,
  FileVideo,
  List,
} from 'lucide-react';
import { WebtorPlayer } from './components/WebtorPlayer';
import { TorrentInspector } from './components/TorrentInspector';
import { DragDropOverlay } from './components/DragDropOverlay';
import { SettingsModal } from './components/SettingsModal';
import { SAMPLE_MOVIES, SampleMovie } from './data/samples';
import {
  parseMagnetURI,
  parseTorrentFile,
  ParsedTorrentInfo,
  formatBytes,
} from './utils/torrentParser';

interface StreamHistoryItem {
  id: string;
  name: string;
  magnet: string;
  infoHash: string;
  timestamp: number;
  size?: number;
}

export default function App() {
  const [inputVal, setInputVal] = useState('');
  const [currentMagnet, setCurrentMagnet] = useState<string>(SAMPLE_MOVIES[0].magnet);
  const [currentTitle, setCurrentTitle] = useState<string>(SAMPLE_MOVIES[0].title);
  const [currentPoster, setCurrentPoster] = useState<string | undefined>(SAMPLE_MOVIES[0].poster);
  const [selectedFile, setSelectedFile] = useState<string | undefined>(undefined);
  const [torrentInfo, setTorrentInfo] = useState<ParsedTorrentInfo | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Panels
  const [showInspector, setShowInspector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings & History
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => {
    return localStorage.getItem('webtor_base_url') || 'https://webtor.io';
  });
  const [streamHistory, setStreamHistory] = useState<StreamHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('webtor_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const playerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save history helper
  const addToHistory = (name: string, magnet: string, infoHash: string, size?: number) => {
    const newItem: StreamHistoryItem = {
      id: `${infoHash}_${Date.now()}`,
      name,
      magnet,
      infoHash,
      timestamp: Date.now(),
      size,
    };
    setStreamHistory((prev) => {
      const filtered = prev.filter((item) => item.infoHash !== infoHash);
      const updated = [newItem, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('webtor_history', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Load stream from Magnet URI string
  const loadMagnetStream = (rawInput: string, customName?: string, poster?: string) => {
    setErrorMessage(null);
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    // Check if user entered a title of one of our curated sample movies
    const sampleMatch = SAMPLE_MOVIES.find(
      (m) =>
        m.title.toLowerCase() === trimmed.toLowerCase() ||
        (trimmed.length >= 3 && m.title.toLowerCase().includes(trimmed.toLowerCase()))
    );
    if (sampleMatch && !trimmed.toLowerCase().startsWith('magnet:?')) {
      setCurrentMagnet(sampleMatch.magnet);
      setCurrentTitle(sampleMatch.title);
      setCurrentPoster(sampleMatch.poster);
      setSelectedFile(undefined);
      try {
        const parsed = parseMagnetURI(sampleMatch.magnet);
        setTorrentInfo(parsed);
      } catch {
        // ignore
      }
      addToHistory(sampleMatch.title, sampleMatch.magnet, sampleMatch.id);
      showToast(`Now streaming: ${sampleMatch.title}`);
      playerRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    try {
      const parsed = parseMagnetURI(trimmed);
      setCurrentMagnet(parsed.magnetURI);
      setCurrentTitle(customName || parsed.name);
      setCurrentPoster(poster);
      setSelectedFile(undefined);
      setTorrentInfo(parsed);
      addToHistory(customName || parsed.name, parsed.magnetURI, parsed.infoHash);
      showToast(`Now streaming: ${customName || parsed.name}`);
      playerRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          'Please enter a valid magnet link (e.g. magnet:?xt=urn:btih:...), 40-character info hash, or .torrent URL.'
      );
    }
  };

  // Load stream from .torrent File
  const handleTorrentFile = async (file: File) => {
    setIsProcessingFile(true);
    setErrorMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parseTorrentFile(buffer);
      setCurrentMagnet(parsed.magnetURI);
      setCurrentTitle(parsed.name);
      setCurrentPoster(undefined);
      setSelectedFile(undefined);
      setTorrentInfo(parsed);
      addToHistory(parsed.name, parsed.magnetURI, parsed.infoHash, parsed.totalLength);
      showToast(`Loaded .torrent: ${parsed.name}`);
      playerRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      setErrorMessage('Could not parse .torrent file. Please ensure it is a valid BitTorrent file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Check URL hash for direct link on initial mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('magnet=')) {
      const match = hash.match(/magnet=([^&]+)/);
      if (match && match[1]) {
        try {
          const decodedMagnet = decodeURIComponent(match[1]);
          loadMagnetStream(decodedMagnet);
          return;
        } catch (e) {
          console.error(e);
        }
      }
    }
    // Default load Sintel on initial mount
    try {
      const parsed = parseMagnetURI(SAMPLE_MOVIES[0].magnet);
      setTorrentInfo(parsed);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Global Drag & Drop listener
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.torrent') || file.type.includes('bittorrent')) {
          handleTorrentFile(file);
        } else {
          setErrorMessage('Please drop a valid .torrent file or paste a magnet link.');
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Global Paste listener (Ctrl+V / Cmd+V anywhere on window)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Do not intercept if user is typing in an active input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const pastedText = e.clipboardData?.getData('text');
      if (pastedText) {
        const trimmed = pastedText.trim();
        if (
          trimmed.startsWith('magnet:?') ||
          /^[0-9a-fA-F]{40}$/.test(trimmed) ||
          /^[2-7a-zA-Z]{32}$/.test(trimmed)
        ) {
          e.preventDefault();
          setInputVal(trimmed);
          loadMagnetStream(trimmed);
          showToast('Magnet link detected and loaded from clipboard!');
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Form submit handler
  const handleStreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    loadMagnetStream(inputVal.trim());
  };

  // Clipboard button paste handler
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputVal(text.trim());
        loadMagnetStream(text.trim());
      }
    } catch {
      inputRef.current?.focus();
      showToast('Please press Ctrl+V to paste into the search box');
    }
  };

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleTorrentFile(file);
    }
  };

  // Clear history handler
  const handleClearHistory = () => {
    setStreamHistory([]);
    localStorage.removeItem('webtor_history');
    showToast('Stream history cleared');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-200">
      {/* Full-window Drag & Drop Overlay */}
      <DragDropOverlay isDragging={isDragging} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-neutral-900/95 border border-amber-500/40 text-neutral-100 shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-5 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (4-5 Nav Links) — Zone 3 (Primary Action) */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <a
            href="/"
            className="flex items-center gap-2.5 text-base font-bold tracking-tight text-neutral-100 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity font-display"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Film className="w-4 h-4" />
            </div>
            <span>WebtorStream</span>
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
            <a href="#player-section" className="hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0">
              Live Player
            </a>
            <a href="#samples-section" className="hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0">
              Curated Movies
            </a>
            <a href="#history-section" className="hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0">
              Stream History
            </a>
            <button
              onClick={() => setShowSettings(true)}
              className="hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                inputRef.current?.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Stream Torrent</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="grow">
        {/* Hero Section & Magnet Input / Drag-Drop Zone */}
        <section className="relative pt-10 pb-12 overflow-hidden border-b border-neutral-900">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
            {/* Clean Hero Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-100 font-display text-balance">
              Instant Torrent Streaming in Your Browser
            </h1>
            <p className="mt-3 text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              Powered by the official Webtor Embed SDK. Stream video directly from magnet links or drag and drop any <code className="text-neutral-200">.torrent</code> file without software or plugins.
            </p>

            {/* Main Interactive Magnet Input Box */}
            <form onSubmit={handleStreamSubmit} className="mt-8 relative max-w-2xl mx-auto">
              <div className="relative flex items-center rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl p-2 focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Paste magnet:?xt=urn:btih:..., infohash, or .torrent URL"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full bg-transparent px-4 py-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />

                <div className="flex items-center gap-1.5 shrink-0 pr-1">
                  {/* Clipboard paste helper */}
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    title="Paste from clipboard"
                    className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                  >
                    <Clipboard className="w-4 h-4" />
                    <span className="hidden sm:inline text-[11px]">Paste</span>
                  </button>

                  {/* Browse file trigger */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".torrent,application/x-bittorrent"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Browse local .torrent file"
                    className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span className="hidden sm:inline text-[11px]">File</span>
                  </button>

                  {/* Stream CTA */}
                  <button
                    type="submit"
                    disabled={!inputVal.trim() || isProcessingFile}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    {isProcessingFile ? (
                      <span className="animate-spin text-xs">●</span>
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Stream</span>
                  </button>
                </div>
              </div>

              {/* Error Callout */}
              {errorMessage && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Fast Sample Shortcuts */}
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs text-neutral-400">
                <span className="text-neutral-500">Quick test:</span>
                {SAMPLE_MOVIES.slice(0, 3).map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => loadMagnetStream(movie.magnet, movie.title, movie.poster)}
                    className="hover:text-amber-400 text-neutral-300 underline underline-offset-4 transition-colors"
                  >
                    {movie.title}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </section>

        {/* Live Player Section */}
        <section id="player-section" ref={playerRef} className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-100 font-display">Active Torrent Stream</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Streaming peer-to-peer data transcoded on-the-fly into browser HLS
              </p>
            </div>
            {torrentInfo && (
              <button
                onClick={() => setShowInspector(true)}
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <List className="w-3.5 h-3.5 text-amber-400" />
                <span>Torrent Files & Trackers</span>
              </button>
            )}
          </div>

          {/* The Player Component */}
          <WebtorPlayer
            magnet={currentMagnet}
            torrentInfo={torrentInfo}
            poster={currentPoster}
            title={currentTitle}
            selectedFile={selectedFile}
            customBaseUrl={customBaseUrl}
            onOpenInspector={() => setShowInspector(true)}
          />
        </section>

        {/* Curated Sample Open-Source Movies Section */}
        <section id="samples-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-900">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-100 font-display">
                Open-Source Cinema Showcase
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
                Click any of these legal, public-domain masterpieces from the Blender Foundation to test in-browser streaming instantly.
              </p>
            </div>
            <div className="text-xs text-neutral-400 font-mono">
              <span>{SAMPLE_MOVIES.length} verified sample swarms</span>
            </div>
          </div>

          {/* Movies Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_MOVIES.map((movie) => {
              const isPlaying = currentMagnet === movie.magnet;
              return (
                <div
                  key={movie.id}
                  className={`group rounded-2xl bg-neutral-900/60 border overflow-hidden transition-all duration-300 flex flex-col ${
                    isPlaying
                      ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                      : 'border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  {/* Poster Image Container */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

                    {/* Quality & Duration Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-amber-400 border border-amber-500/30">
                        {movie.resolution}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 text-[11px] font-mono text-neutral-300 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md">
                      {movie.duration}
                    </div>

                    {/* Bottom Play CTA Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-neutral-300 tabular-nums">
                        {movie.size}
                      </span>

                      <button
                        onClick={() => loadMagnetStream(movie.magnet, movie.title, movie.poster)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isPlaying
                            ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                            : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isPlaying ? 'Now Playing' : 'Stream Film'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Movie Info */}
                  <div className="p-5 flex flex-col grow justify-between">
                    <div>
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <h3 className="text-base font-bold text-neutral-100 group-hover:text-amber-400 transition-colors font-display">
                          {movie.title}
                        </h3>
                        <span className="text-xs text-neutral-500 font-mono">{movie.year}</span>
                      </div>

                      {/* Clean Unboxed Metadata with · separator */}
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
                        <span>{movie.genre}</span>
                        <span>·</span>
                        <span>{movie.studio}</span>
                      </div>

                      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                        {movie.synopsis}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stream History Section */}
        {streamHistory.length > 0 && (
          <section id="history-section" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-bold text-neutral-100 font-display">Recent Streams</h2>
              </div>
              <button
                onClick={handleClearHistory}
                className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
              >
                Clear History
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {streamHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800/80 hover:border-neutral-700 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-neutral-200 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5 font-mono">
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      {item.size ? (
                        <>
                          <span>·</span>
                          <span>{formatBytes(item.size)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <button
                    onClick={() => loadMagnetStream(item.magnet, item.name)}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 shrink-0 transition-colors"
                    title="Resume Stream"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Feature Explainer Bento / Architecture Overview */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-100 font-display">Drag & Drop Any Torrent</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Drop raw <code className="text-neutral-300">.torrent</code> files straight onto the browser window. The client parses bencoded dictionaries and computes SHA-1 infohashes via Web Crypto in microseconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <FileVideo className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-100 font-display">Seamless Webtor HLS Transcode</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Integrated with the official Webtor Embed SDK. Streams videos encoded in MKV, AVI, MP4, and WEBM formats with full timeline seeking and zero browser extensions needed.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-100 font-display">Self-Hosted or Cloud Swarm</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Connect seamlessly to the public Webtor network or plug in your private self-hosted Webtor Docker cluster via the settings modal.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-6 px-4 sm:px-6 lg:px-8 bg-neutral-950 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-300">WebtorStream</span>
            <span>·</span>
            <span>Built with @webtor/embed-sdk-js</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/webtor-io/embed-sdk-js"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-200 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub SDK</span>
            </a>
            <a
              href="https://webtor.io"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-200 transition-colors"
            >
              Webtor.io
            </a>
          </div>
        </div>
      </footer>

      {/* Torrent Inspector Modal */}
      {showInspector && (
        <TorrentInspector
          torrentInfo={torrentInfo}
          selectedFile={selectedFile}
          onSelectFile={(filePath) => {
            setSelectedFile(filePath);
            showToast(`Selected file: ${filePath.split('/').pop()}`);
          }}
          onClose={() => setShowInspector(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          customBaseUrl={customBaseUrl}
          onSaveBaseUrl={(url) => {
            setCustomBaseUrl(url);
            localStorage.setItem('webtor_base_url', url);
            showToast(`Backend updated to ${url}`);
          }}
          onClearHistory={handleClearHistory}
          historyCount={streamHistory.length}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
