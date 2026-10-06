import React from 'react';
import {
  Layers,
  Sparkles,
  Download,
  FileSpreadsheet,
  FileJson,
  FolderPlus,
  RefreshCw,
  RotateCcw,
  Check,
  Star,
  Flag,
  Copy,
  Brain,
  Sliders,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { FilterKey, PhotoItem, AIThresholds } from '../types';

interface SidebarProps {
  currentFilter: FilterKey;
  onSelectFilter: (f: FilterKey) => void;
  counts: Record<FilterKey, number>;
  totalPhotos: number;
  onAnalyzeAll: () => void;
  onAcceptAI: () => void;
  isAnalyzing: boolean;
  analyzingProgress: { current: number; total: number } | null;
  onDownloadZip: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onRefresh: () => void;
  onResetAll: () => void;
  thresholds: AIThresholds;
  onThresholdsChange: (t: AIThresholds) => void;
  destFolders: Record<string, string>;
  onPickDest: (cat: 'good' | 'alt' | 'reject') => void;
  onCreateFolders: () => void;
  autoCopy: boolean;
  onToggleAutoCopy: (val: boolean) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  onSelectFilter,
  counts,
  totalPhotos,
  onAnalyzeAll,
  onAcceptAI,
  isAnalyzing,
  analyzingProgress,
  onDownloadZip,
  onExportCSV,
  onExportJSON,
  onRefresh,
  onResetAll,
  thresholds,
  onThresholdsChange,
  destFolders,
  onPickDest,
  onCreateFolders,
  autoCopy,
  onToggleAutoCopy,
  isOpenMobile,
  onCloseMobile,
}) => {
  const filterList: Array<{ key: FilterKey; label: string; icon?: React.ReactNode }> = [
    { key: 'all', label: 'All Photos' },
    { key: 'unsorted', label: 'Unsorted' },
    { key: 'good', label: 'Good' },
    { key: 'alt', label: 'Alternative' },
    { key: 'reject', label: 'Reject' },
    { key: 'aigood', label: 'AI Recommended' },
    { key: 'low', label: 'Low Confidence' },
    { key: 'fav', label: 'Favorites' },
    { key: 'flag', label: 'Flagged' },
    { key: 'dup', label: 'Similar Shots' },
    { key: 'match', label: 'Client List' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static top-0 bottom-0 left-0 w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col z-50 md:z-20 transition-transform duration-200 ease-out select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Section: Library Filters */}
          <div>
            <div className="px-2 pb-2 text-[11px] font-mono tracking-wider text-zinc-500 uppercase flex items-center justify-between">
              <span>Library</span>
              <span className="text-zinc-600">{totalPhotos}</span>
            </div>
            <nav className="space-y-0.5">
              {filterList.map((item) => {
                const isActive = currentFilter === item.key;
                const count = counts[item.key] ?? 0;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onSelectFilter(item.key);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-white font-medium shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        isActive ? 'text-zinc-200' : 'text-zinc-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section: Local AI Culling */}
          <div className="border-t border-zinc-900 pt-4">
            <div className="px-2 pb-2 text-[11px] font-mono tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
              <Brain className="w-3 h-3 text-zinc-400" />
              <span>AI Evaluation</span>
            </div>

            <div className="space-y-1.5">
              <button
                disabled={isAnalyzing || totalPhotos === 0}
                onClick={onAnalyzeAll}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-between"
              >
                <span>Analyze All Photos</span>
                {isAnalyzing && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                )}
              </button>

              {analyzingProgress && (
                <div className="px-2 pt-1 pb-1">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1">
                    <span>Processing</span>
                    <span>
                      {analyzingProgress.current} / {analyzingProgress.total}
                    </span>
                  </div>
                  <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-150"
                      style={{
                        width: `${(analyzingProgress.current / analyzingProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                disabled={totalPhotos === 0}
                onClick={onAcceptAI}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Apply AI Suggestions
              </button>

              {/* Threshold controls */}
              <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-900 space-y-2 text-[11px] text-zinc-400 mt-2">
                <div className="flex items-center justify-between">
                  <span>Good Threshold:</span>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={thresholds.good}
                    onChange={(e) =>
                      onThresholdsChange({ ...thresholds, good: Number(e.target.value) || 85 })
                    }
                    className="w-12 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-center text-zinc-100 font-mono text-xs focus:border-zinc-500 outline-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Alt Threshold:</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={thresholds.alt}
                    onChange={(e) =>
                      onThresholdsChange({ ...thresholds, alt: Number(e.target.value) || 65 })
                    }
                    className="w-12 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-center text-zinc-100 font-mono text-xs focus:border-zinc-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Direct Folder Routing */}
          <div className="border-t border-zinc-900 pt-4">
            <div className="px-2 pb-2 text-[11px] font-mono tracking-wider text-zinc-500 uppercase flex items-center justify-between">
              <span>Disk Folders</span>
              <span className="text-[10px] text-zinc-600">Chrome/Edge</span>
            </div>

            <div className="space-y-1.5">
              {(['good', 'alt', 'reject'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => onPickDest(cat)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center justify-between group"
                >
                  <span className="font-mono text-[11px] uppercase text-zinc-400">
                    {cat}:
                  </span>
                  <span className="truncate max-w-[130px] text-zinc-400 group-hover:text-zinc-200">
                    {destFolders[cat] || 'Set folder...'}
                  </span>
                </button>
              ))}

              <button
                onClick={onCreateFolders}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5 text-zinc-400" />
                <span>Auto-Create Folders</span>
              </button>

              <label className="flex items-center gap-2 px-1 pt-1 text-[11px] text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCopy}
                  onChange={(e) => onToggleAutoCopy(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-900 text-white focus:ring-0 cursor-pointer"
                />
                <span>Auto-copy on decision</span>
              </label>
            </div>
          </div>

          {/* Section: Export & Backup */}
          <div className="border-t border-zinc-900 pt-4">
            <div className="px-2 pb-2 text-[11px] font-mono tracking-wider text-zinc-500 uppercase">
              Export Results
            </div>
            <div className="space-y-1.5">
              <button
                onClick={onDownloadZip}
                disabled={totalPhotos === 0}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs border border-zinc-700 bg-zinc-100 hover:bg-white text-zinc-950 font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-zinc-900" />
                <span>Download ZIP (Folders)</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={onExportCSV}
                  disabled={totalPhotos === 0}
                  className="px-2 py-1.5 rounded-lg text-[11px] border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <FileSpreadsheet className="w-3 h-3 text-zinc-400" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={onExportJSON}
                  disabled={totalPhotos === 0}
                  className="px-2 py-1.5 rounded-lg text-[11px] border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <FileJson className="w-3 h-3 text-zinc-400" />
                  <span>JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom utility bar */}
        <div className="p-3 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
            title="Reload source folder"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rescan</span>
          </button>

          <button
            onClick={onResetAll}
            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Reset decisions for this project"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </aside>
    </>
  );
};
