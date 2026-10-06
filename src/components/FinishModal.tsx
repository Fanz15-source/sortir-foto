import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  RotateCcw,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { PhotoItem } from '../types';

interface FinishModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoItem[];
  projectName: string;
  onDownloadZip: () => void;
  onExportCSV: () => void;
  onResetTasks: () => void;
}

export const FinishModal: React.FC<FinishModalProps> = ({
  isOpen,
  onClose,
  photos,
  projectName,
  onDownloadZip,
  onExportCSV,
  onResetTasks,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const total = photos.length;
  const goodCount = photos.filter((p) => p.st === 'good').length;
  const altCount = photos.filter((p) => p.st === 'alt').length;
  const rejectCount = photos.filter((p) => p.st === 'reject').length;
  const unsortedCount = photos.filter((p) => p.st === 'unsorted').length;
  const sortedCount = total - unsortedCount;
  const percentage = total > 0 ? Math.round((sortedCount / total) * 100) : 0;
  const favCount = photos.filter((p) => p.fav).length;
  const flagCount = photos.filter((p) => p.fl).length;

  const handleFinishAndReset = () => {
    onResetTasks();
    setConfirmReset(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-zinc-950 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Selesaikan Sesi (Finish Session)
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                {projectName || 'Current Project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-850 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          {/* Summary Progress Card */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-850 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-zinc-300">
                Penyelesaian Tugas
              </span>
              <span className="text-sm font-bold font-mono text-white tabular-nums">
                {percentage}% ({sortedCount} / {total})
              </span>
            </div>

            <div className="h-2 bg-zinc-850 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-850/60">
                <div className="text-[10px] text-zinc-500 uppercase">1. Good</div>
                <div className="text-base font-bold text-white tabular-nums">
                  {goodCount}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-850/60">
                <div className="text-[10px] text-zinc-500 uppercase">2. Alt</div>
                <div className="text-base font-bold text-zinc-300 tabular-nums">
                  {altCount}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-850/60">
                <div className="text-[10px] text-zinc-500 uppercase">3. Reject</div>
                <div className="text-base font-bold text-zinc-400 tabular-nums">
                  {rejectCount}
                </div>
              </div>
            </div>

            {(favCount > 0 || flagCount > 0) && (
              <div className="flex items-center justify-around text-[11px] text-zinc-400 font-mono pt-1">
                <span>★ Favorites: {favCount}</span>
                <span>·</span>
                <span>⚑ Flagged: {flagCount}</span>
                <span>·</span>
                <span>Unsorted: {unsortedCount}</span>
              </div>
            )}
          </div>

          {/* Export Recommended Before Resetting */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-300">
              Simpan Hasil Sortir (Disarankan Sebelum Reset)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={onDownloadZip}
                disabled={total === 0 || sortedCount === 0}
                className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Download ZIP (Folders)</span>
              </button>
              <button
                onClick={onExportCSV}
                disabled={total === 0}
                className="px-3 py-2 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
                <span>Export Laporan CSV</span>
              </button>
            </div>
          </div>

          {/* Reset All Tasks Section (Requested Feature) */}
          <div className="pt-2 border-t border-zinc-900">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                disabled={total === 0}
                className="w-full py-2.5 px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 hover:bg-zinc-850 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <RotateCcw className="w-4 h-4 text-zinc-400" />
                <span>Finish & Reset Semua Tugas</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl border border-zinc-700 bg-zinc-900 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-start gap-2 text-zinc-300 text-xs">
                  <AlertTriangle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    Konfirmasi: Semua keputusan (Good, Alt, Reject), favorit, dan flag pada proyek ini akan direset kembali menjadi kosong/unsorted.
                  </p>
                </div>
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleFinishAndReset}
                    className="px-3.5 py-1.5 rounded-lg bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors"
                  >
                    Ya, Reset Semua Tugas
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-900/40 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-500">
          <span>Foto lokal Anda tetap aman di perangkat.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md text-zinc-400 hover:text-white transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
