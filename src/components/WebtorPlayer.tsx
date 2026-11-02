import React, { useEffect, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Share2,
  FileVideo,
  List,
  Sparkles,
  Info,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Subtitles,
} from 'lucide-react';
import { ParsedTorrentInfo, formatBytes } from '../utils/torrentParser';

declare global {
  interface Window {
    webtor?: any;
  }
}

interface WebtorPlayerProps {
  magnet: string;
  torrentInfo: ParsedTorrentInfo | null;
  poster?: string;
  title?: string;
  selectedFile?: string;
  customBaseUrl?: string;
  onOpenInspector: () => void;
  onSelectSample?: (id: string) => void;
}

export const WebtorPlayer: React.FC<WebtorPlayerProps> = ({
  magnet,
  torrentInfo,
  poster,
  title,
  selectedFile,
  customBaseUrl,
  onOpenInspector,
}) => {
  const [isTheater, setIsTheater] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [playerState, setPlayerState] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [customSubtitleUrl, setCustomSubtitleUrl] = useState<string>('');
  const [showSubModal, setShowSubModal] = useState(false);
  const [activeSubtitles, setActiveSubtitles] = useState<{ srclang: string; label: string; src: string; default?: boolean }[]>([]);

  // Unique identifier for player container so DOM replaces cleanly
  const [instanceKey, setInstanceKey] = useState<number>(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTitle = title || torrentInfo?.name || 'Torrent Stream';

  // Initialize Webtor player when magnet, selectedFile, or customBaseUrl changes
  useEffect(() => {
    const newKey = Date.now();
    setInstanceKey(newKey);
    setPlayerState('initializing');

    const containerId = `webtor-player-${newKey}`;

    const timer = setTimeout(() => {
      try {
        window.webtor = window.webtor || [];

        const config: Record<string, any> = {
          id: containerId,
          width: '100%',
          height: '100%',
          header: true,
          controls: true,
          title: activeTitle,
          baseUrl: customBaseUrl?.trim() || 'https://webtor.io',
          features: {
            subtitles: true,
            settings: true,
            fullscreen: true,
            playpause: true,
            currentTime: true,
            timeline: true,
            duration: true,
            volume: true,
            chromecast: true,
            embed: false,
          },
          on: (e: any) => {
            if (e && e.name === 'TORRENT_FETCHED') {
              setPlayerState('ready');
            } else if (e && e.name === 'TORRENT_ERROR') {
              setPlayerState('error');
            }
          },
        };

        if (magnet.startsWith('http://') || magnet.startsWith('https://')) {
          config.torrentUrl = magnet;
        } else {
          config.magnet = magnet;
        }

        if (poster) {
          config.poster = poster;
        }

        if (selectedFile) {
          config.path = selectedFile;
        }

        if (activeSubtitles.length > 0) {
          config.subtitles = activeSubtitles;
        }

        window.webtor.push(config);

        // Set ready state after short delay if no explicit error
        const fallbackTimer = setTimeout(() => {
          setPlayerState((prev) => (prev === 'initializing' ? 'ready' : prev));
        }, 3500);

        return () => clearTimeout(fallbackTimer);
      } catch (err) {
        console.error('Failed to initialize Webtor player:', err);
        setPlayerState('error');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [magnet, selectedFile, customBaseUrl, activeSubtitles]);

  const handleCopyMagnet = () => {
    navigator.clipboard.writeText(magnet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#magnet=${encodeURIComponent(magnet)}`;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const handleAddSubtitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSubtitleUrl.trim()) return;

    const label = customSubtitleUrl.split('/').pop()?.split('.')[0] || 'Custom Track';
    const newTrack = {
      srclang: 'en',
      label: label.slice(0, 16),
      src: customSubtitleUrl.trim(),
      default: true,
    };
    setActiveSubtitles((prev) => [...prev, newTrack]);
    setCustomSubtitleUrl('');
    setShowSubModal(false);
  };

  const handleFileUploadSub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const newTrack = {
      srclang: 'en',
      label: file.name.replace(/\.[^/.]+$/, '').slice(0, 16),
      src: objectUrl,
      default: true,
    };
    setActiveSubtitles((prev) => [...prev, newTrack]);
    setShowSubModal(false);
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isTheater
          ? 'fixed inset-0 z-50 bg-black/95 flex flex-col p-4 md:p-6 backdrop-blur-md overflow-y-auto'
          : 'relative w-full'
      }`}
    >
      {/* Player Frame Card */}
      <div className="relative rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Control Bar inside Player */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
            <h2 className="text-sm font-semibold text-neutral-100 truncate tracking-tight">{activeTitle}</h2>
            {torrentInfo && torrentInfo.totalLength > 0 && (
              <span className="hidden sm:inline-block text-xs text-neutral-400 font-mono tabular-nums">
                {formatBytes(torrentInfo.totalLength)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Subtitle track button */}
            <button
              onClick={() => setShowSubModal(true)}
              title="Add custom subtitle (.srt/.vtt)"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            >
              <Subtitles className="w-4 h-4" />
            </button>

            {/* Inspect Files Button */}
            <button
              onClick={onOpenInspector}
              title="View torrent file tree and tracker details"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <List className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Inspect Files</span>
              {torrentInfo && torrentInfo.files.length > 0 && (
                <span className="text-[11px] font-mono text-neutral-400">({torrentInfo.files.length})</span>
              )}
            </button>

            {/* Share stream button */}
            <button
              onClick={handleShareLink}
              title="Copy shareable stream URL"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            {/* Copy Magnet */}
            <button
              onClick={handleCopyMagnet}
              title="Copy Magnet URI"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheater(!isTheater)}
              title={isTheater ? 'Exit Theater Mode (Esc)' : 'Theater Mode'}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            >
              {isTheater ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video Player Display Container */}
        <div
          ref={containerRef}
          className={`relative w-full bg-black flex items-center justify-center webtor-container ${
            isTheater ? 'h-[75vh] md:h-[82vh]' : 'aspect-video min-h-[380px] md:min-h-[500px]'
          }`}
        >
          {/* Active Webtor player mount target */}
          <div
            id={`webtor-player-${instanceKey}`}
            key={instanceKey}
            className="w-full h-full min-h-full flex items-center justify-center"
          />

          {/* Initializing indicator overlay */}
          {playerState === 'initializing' && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] transition-opacity">
              <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3" />
              <p className="text-xs font-medium text-neutral-300 tracking-wide">Connecting to Webtor Swarm...</p>
              <p className="text-[11px] text-neutral-400 mt-1">Discovering seeders & initializing stream transcode</p>
            </div>
          )}

          {/* Error Notice Overlay */}
          {playerState === 'error' && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center bg-neutral-950/95 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
                <Info className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-neutral-100">Unable to Fetch Torrent Swarm</h3>
              <p className="text-xs text-neutral-400 max-w-md mt-1 mb-4">
                The torrent might have 0 active seeders, or the tracker connection timed out. You can retry or open the magnet in your desktop BitTorrent client.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setPlayerState('initializing');
                    setInstanceKey(Date.now());
                  }}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Stream
                </button>
                <a
                  href={magnet}
                  className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in BitTorrent App
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Player Bottom Bar with Stream Insights */}
        <div className="px-4 py-2.5 bg-neutral-900/90 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Zero-install Webtor HLS
            </span>
            {torrentInfo?.infoHash && (
              <span className="hidden lg:flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
                <span>Hash:</span>
                <span className="text-neutral-300 truncate max-w-[140px]">{torrentInfo.infoHash}</span>
              </span>
            )}
            {torrentInfo?.trackers && torrentInfo.trackers.length > 0 && (
              <span className="hidden sm:inline text-neutral-400">
                {torrentInfo.trackers.length} {torrentInfo.trackers.length === 1 ? 'tracker' : 'trackers'}
              </span>
            )}
            {selectedFile && (
              <span className="flex items-center gap-1 text-amber-300/90 max-w-[200px] truncate" title={selectedFile}>
                <FileVideo className="w-3 h-3 shrink-0" />
                <span className="truncate">{selectedFile.split('/').pop()}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <a
              href={magnet}
              className="text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-1 text-[11px]"
              title="Open magnet directly in your local desktop torrent client"
            >
              <ExternalLink className="w-3 h-3" />
              <span>BitTorrent Client</span>
            </a>
          </div>
        </div>
      </div>

      {/* Subtitles Custom Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Subtitles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-neutral-100">Add Custom Subtitle Track</h3>
              </div>
              <button
                onClick={() => setShowSubModal(false)}
                className="text-neutral-400 hover:text-neutral-200 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Load an external <code className="text-amber-300">.srt</code> or <code className="text-amber-300">.vtt</code> subtitle file or direct URL to render alongside playback.
            </p>

            <form onSubmit={handleAddSubtitle} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Subtitle Direct URL (.vtt / .srt)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/subtitles/english.vtt"
                  value={customSubtitleUrl}
                  onChange={(e) => setCustomSubtitleUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="relative py-2 flex items-center">
                <div className="grow border-t border-neutral-800"></div>
                <span className="shrink mx-2 text-[10px] text-neutral-500 uppercase tracking-widest">or upload file</span>
                <div className="grow border-t border-neutral-800"></div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Upload Local Subtitle File</label>
                <input
                  type="file"
                  accept=".srt,.vtt,.sub"
                  onChange={handleFileUploadSub}
                  className="w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer"
                />
              </div>

              {activeSubtitles.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block mb-1.5">Loaded Subtitle Tracks:</span>
                  <div className="space-y-1">
                    {activeSubtitles.map((sub, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-neutral-950 rounded border border-neutral-800"
                      >
                        <span className="text-neutral-200 truncate">{sub.label}</span>
                        <button
                          type="button"
                          onClick={() => setActiveSubtitles((subs) => subs.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 text-[11px] ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-3 py-1.5 bg-neutral-800 text-neutral-300 text-xs font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Close
                </button>
                {customSubtitleUrl.trim() && (
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-amber-500 text-neutral-950 text-xs font-semibold rounded-lg hover:bg-amber-400 transition-colors"
                  >
                    Add Track
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
