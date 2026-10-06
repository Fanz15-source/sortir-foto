import React from 'react';
import {
  Undo2,
  Redo2,
  Star,
  Flag,
  Check,
  Slash,
  X as CloseIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { SortStatus, PhotoItem } from '../types';

interface ActionBarProps {
  onDecide: (status: 'good' | 'alt' | 'reject') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onToggleFavorite: () => void;
  onToggleFlag: () => void;
  currentPhoto: PhotoItem | null;
  selectedCount: number;
  onClearSelection: () => void;
  onToggleInspector: () => void;
  inspectorOpen: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  onDecide,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onToggleFavorite,
  onToggleFlag,
  currentPhoto,
  selectedCount,
  onClearSelection,
  onToggleInspector,
  inspectorOpen,
}) => {
  return (
    <footer className="h-16 bg-zinc-950 border-t border-zinc-800/80 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-20 select-none">
      {/* Left zone: Undo, Redo, Inspector Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo decision (Ctrl+Z)"
          aria-label="Undo"
          className="p-2 sm:px-3 sm:py-2 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/90 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5 text-xs"
        >
          <Undo2 className="w-4 h-4" />
          <span className="hidden md:inline">Undo</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo decision (Ctrl+Shift+Z)"
          aria-label="Redo"
          className="p-2 sm:px-3 sm:py-2 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/90 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5 text-xs"
        >
          <Redo2 className="w-4 h-4" />
          <span className="hidden md:inline">Redo</span>
        </button>

        <button
          onClick={onToggleInspector}
          title="Toggle Photo Details & AI Inspector"
          aria-label="Toggle Details"
          className={`p-2 sm:px-2.5 sm:py-2 rounded-lg border transition-colors flex items-center gap-1 text-xs ${
            inspectorOpen
              ? 'border-zinc-600 bg-zinc-800 text-white'
              : 'border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden lg:inline">Inspect</span>
        </button>
      </div>

      {/* Center zone: Core sorting actions (3 Reject, 2 Alt, 1 Good) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg justify-center">
        {selectedCount > 1 && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <span>{selectedCount} selected</span>
            <button
              onClick={onClearSelection}
              className="text-zinc-500 hover:text-white underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* 3 Reject */}
        <button
          onClick={() => onDecide('reject')}
          title="Mark as Reject (shortcut: 3)"
          className="flex-1 max-w-[130px] py-2 sm:py-2.5 px-3 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 hover:border-zinc-700 active:scale-[0.97] transition-all text-xs sm:text-sm font-semibold text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
        >
          <CloseIcon className="w-4 h-4 stroke-[2.5]" />
          <span>3 Reject</span>
        </button>

        {/* 2 Alternative */}
        <button
          onClick={() => onDecide('alt')}
          title="Mark as Alternative (shortcut: 2)"
          className="flex-1 max-w-[130px] py-2 sm:py-2.5 px-3 rounded-lg border border-zinc-700 bg-zinc-850 hover:bg-zinc-800 active:scale-[0.97] transition-all text-xs sm:text-sm font-semibold text-zinc-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
        >
          <Slash className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>2 Alt</span>
        </button>

        {/* 1 Good (The Primary Focus Action) */}
        <button
          onClick={() => onDecide('good')}
          title="Mark as Good / Select (shortcut: 1)"
          className="flex-1 max-w-[140px] py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.97] transition-all text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>1 Good</span>
        </button>
      </div>

      {/* Right zone: Favorite & Flag */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={onToggleFavorite}
          title="Toggle Favorite (S)"
          aria-label="Favorite"
          className={`p-2 rounded-lg border transition-colors ${
            currentPhoto?.fav
              ? 'border-zinc-400 bg-zinc-800 text-white'
              : 'border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Star
            className={`w-4 h-4 ${
              currentPhoto?.fav ? 'fill-white text-white' : ''
            }`}
          />
        </button>

        <button
          onClick={onToggleFlag}
          title="Toggle Flag (X)"
          aria-label="Flag"
          className={`p-2 rounded-lg border transition-colors ${
            currentPhoto?.fl
              ? 'border-zinc-400 bg-zinc-800 text-white'
              : 'border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Flag
            className={`w-4 h-4 ${
              currentPhoto?.fl ? 'fill-white text-white' : ''
            }`}
          />
        </button>
      </div>
    </footer>
  );
};
