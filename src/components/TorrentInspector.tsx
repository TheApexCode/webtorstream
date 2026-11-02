import React, { useState } from 'react';
import {
  X,
  FileVideo,
  FileText,
  FileAudio,
  File,
  HardDrive,
  Copy,
  Check,
  Play,
  Share2,
  Radio,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ParsedTorrentInfo, formatBytes, TorrentFileItem } from '../utils/torrentParser';

interface TorrentInspectorProps {
  torrentInfo: ParsedTorrentInfo | null;
  selectedFile?: string;
  onSelectFile: (filePath: string) => void;
  onClose: () => void;
}

export const TorrentInspector: React.FC<TorrentInspectorProps> = ({
  torrentInfo,
  selectedFile,
  onSelectFile,
  onClose,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedMagnet, setCopiedMagnet] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'trackers' | 'details'>('files');

  if (!torrentInfo) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(torrentInfo.infoHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyMagnet = () => {
    navigator.clipboard.writeText(torrentInfo.magnetURI);
    setCopiedMagnet(true);
    setTimeout(() => setCopiedMagnet(false), 2000);
  };

  const filteredFiles = torrentInfo.files.filter((f) =>
    f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.path.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getFileIcon = (file: TorrentFileItem) => {
    if (file.isVideo) return <FileVideo className="w-4 h-4 text-amber-400 shrink-0" />;
    if (file.isSubtitle) return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (file.isAudio) return <FileAudio className="w-4 h-4 text-blue-400 shrink-0" />;
    return <File className="w-4 h-4 text-neutral-400 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-neutral-100 truncate">{torrentInfo.name}</h3>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="font-mono tabular-nums">
                  {torrentInfo.totalLength > 0 ? formatBytes(torrentInfo.totalLength) : 'Size unknown'}
                </span>
                <span>·</span>
                <span>{torrentInfo.files.length} {torrentInfo.files.length === 1 ? 'file' : 'files'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-neutral-800/60 bg-neutral-950/40">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'files'
                ? 'text-amber-400 border-amber-400 bg-neutral-900/60'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            File Tree ({torrentInfo.files.length})
          </button>
          <button
            onClick={() => setActiveTab('trackers')}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'trackers'
                ? 'text-amber-400 border-amber-400 bg-neutral-900/60'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            Trackers ({torrentInfo.trackers.length})
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'details'
                ? 'text-amber-400 border-amber-400 bg-neutral-900/60'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            Torrent Metadata
          </button>
        </div>

        {/* Content Viewport */}
        <div className="grow overflow-y-auto p-6">
          {activeTab === 'files' && (
            <div className="space-y-4">
              {/* Search file bar if multiple files */}
              {torrentInfo.files.length > 3 && (
                <input
                  type="text"
                  placeholder="Filter files by name..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              )}

              {/* Files List */}
              <div className="space-y-1.5">
                {filteredFiles.map((file, idx) => {
                  const isCurrent = selectedFile === file.path;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/40 text-neutral-100'
                          : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-800/50 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-3">
                        {getFileIcon(file)}
                        <div className="min-w-0">
                          <p className="font-medium truncate text-neutral-200">{file.name}</p>
                          {file.path !== file.name && (
                            <p className="text-[10px] text-neutral-500 truncate">{file.path}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {file.length > 0 && (
                          <span className="font-mono tabular-nums text-neutral-400 text-[11px]">
                            {formatBytes(file.length)}
                          </span>
                        )}
                        {file.isVideo && (
                          <button
                            onClick={() => {
                              onSelectFile(file.path);
                              onClose();
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                              isCurrent
                                ? 'bg-amber-500 text-neutral-950'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>{isCurrent ? 'Playing' : 'Stream'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'trackers' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400 leading-relaxed">
                Active BitTorrent trackers announce swarms and discover peers across DHT networks.
              </p>
              <div className="space-y-1.5">
                {torrentInfo.trackers.map((tr, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-neutral-950/60 border border-neutral-800/80 rounded-xl text-xs text-neutral-300 font-mono"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{tr}</span>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(tr)}
                      title="Copy Tracker URL"
                      className="text-neutral-500 hover:text-neutral-300 p-1 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl">
                  <span className="text-[11px] text-neutral-500 block mb-1">BTIH Info Hash</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-neutral-200 text-xs break-all">{torrentInfo.infoHash}</span>
                    <button
                      onClick={handleCopyHash}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-200 shrink-0"
                      title="Copy Info Hash"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl">
                  <span className="text-[11px] text-neutral-500 block mb-1">Total Payload Size</span>
                  <span className="font-mono text-neutral-200 font-medium">
                    {torrentInfo.totalLength > 0 ? formatBytes(torrentInfo.totalLength) : 'Unknown'}
                  </span>
                </div>

                {torrentInfo.pieceLength && (
                  <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl">
                    <span className="text-[11px] text-neutral-500 block mb-1">Piece Length</span>
                    <span className="font-mono text-neutral-200 font-medium">
                      {formatBytes(torrentInfo.pieceLength)}
                    </span>
                  </div>
                )}

                {torrentInfo.piecesCount && (
                  <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl">
                    <span className="text-[11px] text-neutral-500 block mb-1">Pieces Count</span>
                    <span className="font-mono text-neutral-200 font-medium">
                      {torrentInfo.piecesCount.toLocaleString()} pieces
                    </span>
                  </div>
                )}

                {torrentInfo.creationDate && (
                  <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl">
                    <span className="text-[11px] text-neutral-500 block mb-1">Creation Date</span>
                    <span className="text-neutral-200 font-medium">
                      {torrentInfo.creationDate.toLocaleDateString()} {torrentInfo.creationDate.toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {torrentInfo.createdBy && (
                  <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl">
                    <span className="text-[11px] text-neutral-500 block mb-1">Created By</span>
                    <span className="text-neutral-200 font-medium">{torrentInfo.createdBy}</span>
                  </div>
                )}
              </div>

              {torrentInfo.comment && (
                <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl text-xs">
                  <span className="text-[11px] text-neutral-500 block mb-1">Torrent Comment</span>
                  <p className="text-neutral-300 leading-relaxed italic">{torrentInfo.comment}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
          <button
            onClick={handleCopyMagnet}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            {copiedMagnet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMagnet ? 'Magnet Copied' : 'Copy Magnet Link'}</span>
          </button>

          <a
            href={torrentInfo.magnetURI}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Launch BitTorrent Client</span>
          </a>
        </div>
      </div>
    </div>
  );
};
