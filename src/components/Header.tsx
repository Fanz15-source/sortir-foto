import React from 'react';
import {
  FolderOpen,
  Users,
  Search,
  CheckCircle2,
  HelpCircle,
  Menu,
  X,
  LayoutGrid,
  Film,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { SortStatus } from '../types';

interface HeaderProps {
  projectName: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  viewMode: 'filmstrip' | 'grid';
  onToggleViewMode: () => void;
  onOpenFolder: () => void;
  onLoadSamples: () => void;
  onOpenClientList: () => void;
  onOpenHelp: () => void;
  onOpenFinish: () => void;
  onOpenReset: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  totalPhotos: number;
  sortedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  viewMode,
  onToggleViewMode,
  onOpenFolder,
  onLoadSamples,
  onOpenClientList,
  onOpenHelp,
  onOpenFinish,
  onOpenReset,
  sidebarOpen,
  onToggleSidebar,
  totalPhotos,
  sortedCount,
}) => {
  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-30 select-none">
      {/* Zone 1: Brand & Project Context */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
          aria-label="Toggle Navigation"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white text-zinc-950 flex items-center justify-center font-bold text-xs tracking-tighter">
            PS
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-white leading-none">
              Photo Sorter
            </span>
            <span className="text-[11px] text-zinc-500 truncate max-w-[120px] sm:max-w-[200px] leading-tight font-mono">
              {projectName || 'No folder open'}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Search & Quick View Controller */}
      <div className="flex-1 max-w-md hidden sm:flex items-center gap-2">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit();
              if (e.key === 'Escape') {
                onSearchChange('');
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Search filename... (Ctrl+F)"
            className="w-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-400 rounded-lg pl-8 pr-12 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/50 pointer-events-none">
            ↵
          </kbd>
        </div>

        <button
          onClick={onToggleViewMode}
          title={viewMode === 'filmstrip' ? 'Switch to Grid View (V)' : 'Switch to Filmstrip (V)'}
          className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
        >
          {viewMode === 'filmstrip' ? (
            <LayoutGrid className="w-4 h-4" />
          ) : (
            <Film className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Zone 3: Primary Action Suite */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {totalPhotos === 0 ? (
          <button
            onClick={onLoadSamples}
            className="hidden xs:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
            title="Load 10 monochrome demo photos"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Try Demo</span>
          </button>
        ) : null}

        <button
          onClick={onOpenFolder}
          className="flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors"
          title="Open photo folder from device"
        >
          <FolderOpen className="w-3.5 h-3.5 text-zinc-300" />
          <span className="hidden sm:inline">Open Folder</span>
        </button>

        <button
          onClick={onOpenClientList}
          className="flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-white transition-colors"
          title="Filter and batch download photos requested by client"
        >
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Client List</span>
        </button>

        {/* User requested prominent Finish button */}
        <button
          onClick={onOpenFinish}
          className="flex items-center gap-1.5 text-xs font-medium px-3 sm:px-3.5 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-sm"
          title="Finish and reset sorting tasks"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Finish</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          title="Keyboard shortcuts & guide (H)"
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
