import React, { useState } from 'react';
import { Users, Download, Eye, X, Trash2, Search } from 'lucide-react';
import { PhotoItem } from '../types';

interface ClientListModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoItem[];
  onApplyMatchFilter: (matchedIds: Set<string | number>) => void;
  onDownloadMatchedZip: (matched: PhotoItem[], notFound: string[]) => void;
}

const baseOf = (n: string) => n.replace(/\.[A-Za-z0-9]{2,4}$/, '');

export const ClientListModal: React.FC<ClientListModalProps> = ({
  isOpen,
  onClose,
  photos,
  onApplyMatchFilter,
  onDownloadMatchedZip,
}) => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<{
    hit: PhotoItem[];
    notFound: string[];
    totalTokens: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleFind = () => {
    if (!inputText.trim() || photos.length === 0) {
      setResult(null);
      return;
    }

    const tokens = [
      ...new Set(
        inputText
          .split(/[\n\r,;\t]+/)
          .map((s) =>
            s
              .trim()
              .replace(/^["']+|["']+$/g, '')
              .split(/[\\/]/)
              .pop()
              ?.trim()
          )
          .filter(Boolean) as string[]
      ),
    ];

    const byName = new Map<string, PhotoItem>();
    const byBase = new Map<string, PhotoItem[]>();

    photos.forEach((p) => {
      const n = p.name.toLowerCase();
      byName.set(n, p);
      const b = baseOf(n);
      if (!byBase.has(b)) byBase.set(b, []);
      byBase.get(b)!.push(p);
    });

    const hitSet = new Set<PhotoItem>();
    const nf: string[] = [];

    for (const t of tokens) {
      const l = t.toLowerCase();
      let matched: PhotoItem[] = [];

      if (byName.has(l)) {
        matched = [byName.get(l)!];
      } else if (byBase.has(l)) {
        matched = byBase.get(l)!;
      } else if (byBase.has(baseOf(l))) {
        matched = byBase.get(baseOf(l))!;
      } else if (/^\d{2,}$/.test(l)) {
        const n = l.replace(/^0+/, '') || '0';
        const re = new RegExp('(^|\\D)0*' + n + '(\\D|$)');
        matched = photos.filter((p) => re.test(baseOf(p.name)));
      }

      if (matched.length > 0) {
        matched.forEach((p) => hitSet.add(p));
      } else {
        nf.push(t);
      }
    }

    setResult({
      hit: Array.from(hitSet),
      notFound: nf,
      totalTokens: tokens.length,
    });
  };

  const handleShowInGrid = () => {
    if (!result || result.hit.length === 0) return;
    const ids = new Set(result.hit.map((p) => p.id));
    onApplyMatchFilter(ids);
    onClose();
  };

  const handleDownloadZip = () => {
    if (!result || result.hit.length === 0) return;
    onDownloadMatchedZip(result.hit, result.notFound);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Client Selection List
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Match filenames requested by client
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

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-xs text-zinc-400 leading-relaxed">
            Tempel daftar nama foto pilihan klien (satu per baris atau dipisah koma). Ekstensi file opsional, dan nomor foto seperti <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-200">1847</code> otomatis cocok dengan <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-200">DSC_1847.JPG</code>.
          </div>

          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`DSC_0102.JPG\nDSC_0105\n109\n114`}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 focus:border-zinc-500 outline-none resize-none"
          />

          {/* Result statistics */}
          {result && (
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-850 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">
                  {result.hit.length} foto ditemukan
                </span>
                <span className="text-zinc-500 font-mono">
                  {result.totalTokens - result.notFound.length} dari {result.totalTokens} nama cocok
                </span>
              </div>

              {result.notFound.length > 0 && (
                <div className="text-[11px] text-zinc-400 font-mono pt-1 break-words">
                  <span className="text-zinc-500">Tidak ditemukan: </span>
                  <span className="text-zinc-300">
                    {result.notFound.slice(0, 8).join(', ')}
                    {result.notFound.length > 8 ? ` (+${result.notFound.length - 8} lainnya)` : ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleFind}
              disabled={!inputText.trim()}
              className="px-3.5 py-2 rounded-lg bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari Foto</span>
            </button>

            <button
              onClick={handleShowInGrid}
              disabled={!result || result.hit.length === 0}
              className="px-3 py-2 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-30"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Tampilkan di Grid</span>
            </button>

            <button
              onClick={handleDownloadZip}
              disabled={!result || result.hit.length === 0}
              className="px-3 py-2 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-30 ml-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh ZIP Klien</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-900/40 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-500">
          <button
            onClick={() => {
              setInputText('');
              setResult(null);
            }}
            className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Bersihkan</span>
          </button>
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
