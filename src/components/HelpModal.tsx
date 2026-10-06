import React from 'react';
import { HelpCircle, X, Keyboard, ShieldCheck } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts: Array<{ key: string; desc: string }> = [
    { key: '1', desc: 'Tandai Good (Select)' },
    { key: '2', desc: 'Tandai Alternative' },
    { key: '3', desc: 'Tandai Reject' },
    { key: '← / →', desc: 'Pindah foto sebelumnya / berikutnya' },
    { key: 'Space', desc: 'Zoom ukuran asli (100%) vs Fit layar' },
    { key: 'R', desc: 'Putar foto 90° (Rotate)' },
    { key: 'F', desc: 'Layar penuh (Fullscreen)' },
    { key: 'S', desc: 'Tandai Bintang Favorit (Favorite)' },
    { key: 'X', desc: 'Tandai Bendera (Flag)' },
    { key: 'Ctrl + Z', desc: 'Undo keputusan terakhir' },
    { key: 'Ctrl + Shift + Z', desc: 'Redo keputusan' },
    { key: 'Ctrl + F', desc: 'Fokus ke kolom pencarian nama file' },
    { key: 'V', desc: 'Beralih antara Filmstrip dan Grid view' },
    { key: 'G / A / D / U', desc: 'Filter cepat: Good / Alt / Reject / Unsorted' },
    { key: 'H / ?', desc: 'Buka panduan pintasan ini' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Panduan & Pintasan Keyboard
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Photo Sorter Quick Reference
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

        {/* Scrollable list */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Key shortcut table */}
          <div>
            <div className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider mb-2.5">
              Pintasan Keyboard Utama
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {shortcuts.map((sc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-850"
                >
                  <span className="text-zinc-400">{sc.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-[11px] shadow-sm">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Core Workflow Tips */}
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-850 space-y-2 text-zinc-400 leading-relaxed">
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-zinc-300" />
              <span>Privasi 100% On-Device</span>
            </div>
            <p className="text-[11px]">
              Semua foto diproses langsung di peramban komputer Anda. Tidak ada foto yang diunggah ke internet atau server mana pun.
            </p>
            <p className="text-[11px]">
              Tombol <strong className="text-white">Finish</strong> pada bilah atas digunakan untuk menyelesaikan sesi dan mereset semua status sortir setelah Anda mengunduh hasil ZIP atau mengekspor laporan CSV.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-900/40 border-t border-zinc-850 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-colors"
          >
            Mengerti & Mulai
          </button>
        </div>
      </div>
    </div>
  );
};
