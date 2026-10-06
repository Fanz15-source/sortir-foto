import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  FolderOpen,
  Sparkles,
  Upload,
  Check,
  Slash,
  X as CloseIcon,
  Star,
  Flag,
} from 'lucide-react';
import { PhotoItem, SortStatus } from '../types';

interface PhotoViewerProps {
  currentPhoto: PhotoItem | null;
  currentIndex: number;
  totalInView: number;
  rotation: number;
  onRotate: () => void;
  onOpenFolder: () => void;
  onLoadSamples: () => void;
  onPickFiles: () => void;
  lastReaction: { status: SortStatus; id: number } | null;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  currentPhoto,
  currentIndex,
  totalInView,
  rotation,
  onRotate,
  onOpenFolder,
  onLoadSamples,
  onPickFiles,
  lastReaction,
  onToggleFullscreen,
  isFullscreen,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Manage object URL for current photo
  useEffect(() => {
    setIsZoomed(false);
    if (!currentPhoto) {
      setImgUrl(null);
      return;
    }

    const url = URL.createObjectURL(currentPhoto.file);
    setImgUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentPhoto]);

  // Decision reaction icon helper
  const renderReaction = () => {
    if (!lastReaction) return null;
    const { status } = lastReaction;
    if (status === 'good') {
      return (
        <div className="absolute top-6 right-6 z-30 pointer-events-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>GOOD</span>
        </div>
      );
    }
    if (status === 'alt') {
      return (
        <div className="absolute top-6 right-6 z-30 pointer-events-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold text-xs uppercase tracking-wider shadow-lg animate-bounce">
          <Slash className="w-3.5 h-3.5" />
          <span>ALT</span>
        </div>
      );
    }
    if (status === 'reject') {
      return (
        <div className="absolute top-6 right-6 z-30 pointer-events-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-bold text-xs uppercase tracking-wider shadow-lg animate-bounce">
          <CloseIcon className="w-4 h-4 stroke-[2.5]" />
          <span>REJECT</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-black/95 flex items-center justify-center overflow-hidden min-h-0 select-none group"
    >
      {/* Transient Reaction Badge */}
      {renderReaction()}

      {currentPhoto && imgUrl ? (
        <>
          {/* Top HUD overlay */}
          <div className="absolute top-3 left-4 z-20 pointer-events-none flex items-center gap-2 text-xs text-zinc-400 font-mono drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            <span className="text-zinc-200 font-semibold tabular-nums">
              {currentIndex + 1} / {totalInView}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="truncate max-w-[200px] sm:max-w-xs text-zinc-300">
              {currentPhoto.name}
            </span>
            {currentPhoto.w && currentPhoto.h && (
              <>
                <span className="text-zinc-600 hidden sm:inline">·</span>
                <span className="text-zinc-500 hidden sm:inline tabular-nums">
                  {currentPhoto.w} × {currentPhoto.h}
                </span>
              </>
            )}
            {currentPhoto.fav && <Star className="w-3.5 h-3.5 text-zinc-200 fill-zinc-200 ml-1" />}
            {currentPhoto.fl && <Flag className="w-3.5 h-3.5 text-zinc-300 fill-zinc-300 ml-1" />}
          </div>

          {/* Quick viewer controls on top right */}
          <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 bg-zinc-950/70 backdrop-blur-md border border-zinc-800/80 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title={isZoomed ? 'Fit to Screen (Space)' : 'Zoom Actual Size (Space)'}
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
            <button
              onClick={onRotate}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Rotate 90° (R)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Image Display Area */}
          <div
            className={`w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-auto ${
              isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={imgUrl}
              alt={currentPhoto.name}
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
              className={`transition-transform duration-200 ease-out rounded select-none ${
                isZoomed
                  ? 'max-w-none max-h-none object-none'
                  : 'max-w-full max-h-full object-contain'
              }`}
            />
          </div>
        </>
      ) : (
        /* Empty State / Welcome Dropzone */
        <div className="text-center px-4 py-8 max-w-md mx-auto space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400 shadow-inner">
            <Upload className="w-6 h-6 stroke-[1.75]" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Studio Photo Sorter
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Sort and cull photos locally with high speed keyboard shortcuts, real-time AI image analysis, and client selection matching.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              onClick={onOpenFolder}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Select Folder</span>
            </button>

            <button
              onClick={onLoadSamples}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Try Demo Photos</span>
            </button>
          </div>

          <p className="text-[11px] text-zinc-600 font-mono pt-4">
            Private · 100% on-device processing · No data leaves your machine
          </p>
        </div>
      )}
    </div>
  );
};
