import React from 'react';
import { UploadCloud, Film } from 'lucide-react';

interface DragDropOverlayProps {
  isDragging: boolean;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-150">
      <div className="max-w-lg w-full p-8 rounded-3xl border-2 border-dashed border-amber-500/80 bg-neutral-900/90 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 animate-bounce">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-100 font-display">Drop Your Torrent to Stream</h3>
        <p className="text-xs text-neutral-300 mt-2 max-w-sm leading-relaxed">
          Release your <code className="text-amber-400 font-mono">.torrent</code> file anywhere on screen to extract metadata and launch online streaming instantly.
        </p>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-neutral-400">
          <Film className="w-3.5 h-3.5 text-amber-400" />
          <span>Supports MP4, MKV, AVI, WEBM, and multi-file packages</span>
        </div>
      </div>
    </div>
  );
};
