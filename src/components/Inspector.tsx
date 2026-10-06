import React from 'react';
import { X, Brain, Check, Slash, X as CloseIcon, Info } from 'lucide-react';
import { PhotoItem, AIThresholds } from '../types';
import { getAIRecommendation } from '../utils/ai';

interface InspectorProps {
  photo: PhotoItem | null;
  thresholds: AIThresholds;
  isOpen: boolean;
  onClose: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  photo,
  thresholds,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const recommendation = photo ? getAIRecommendation(photo, thresholds) : null;

  return (
    <aside className="fixed inset-y-0 right-0 w-72 bg-zinc-950 border-l border-zinc-800/80 z-30 lg:static flex flex-col select-none overflow-y-auto p-4 space-y-5 shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-semibold tracking-tight text-white uppercase font-mono">
            Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors lg:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {photo ? (
        <>
          {/* Metadata Grid */}
          <div className="space-y-3 text-xs">
            <div className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider">
              File Details
            </div>
            <dl className="grid grid-cols-3 gap-1.5 text-zinc-400 font-mono text-[11px]">
              <dt className="text-zinc-600">File</dt>
              <dd className="col-span-2 text-zinc-200 truncate font-sans">
                {photo.name}
              </dd>

              <dt className="text-zinc-600">Size</dt>
              <dd className="col-span-2 text-zinc-300">
                {(photo.file.size / 1048576).toFixed(2)} MB
              </dd>

              <dt className="text-zinc-600">Dims</dt>
              <dd className="col-span-2 text-zinc-300">
                {photo.w && photo.h ? `${photo.w} × ${photo.h}` : 'Reading...'}
              </dd>

              <dt className="text-zinc-600">Status</dt>
              <dd className="col-span-2 text-zinc-200 font-sans uppercase font-medium">
                {photo.st === 'good' && '1 Good'}
                {photo.st === 'alt' && '2 Alternative'}
                {photo.st === 'reject' && '3 Reject'}
                {photo.st === 'unsorted' && 'Unsorted'}
              </dd>

              {photo.cp && (
                <>
                  <dt className="text-zinc-600">Disk</dt>
                  <dd className="col-span-2 text-zinc-300">
                    {photo.cp === 'ok' ? 'Copied' : 'Copy Failed'}
                  </dd>
                </>
              )}
            </dl>
          </div>

          {/* AI Metrics Section */}
          <div className="border-t border-zinc-900 pt-4 space-y-4">
            <div className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-zinc-400" />
              <span>AI Evaluation</span>
            </div>

            {photo.ai ? (
              <div className="space-y-4">
                {/* Score Circle / Meter */}
                <div className="flex items-center gap-4 bg-zinc-900/60 p-3 rounded-xl border border-zinc-850">
                  <div className="relative w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold font-mono text-white tabular-nums">
                      {photo.ai.o}
                    </span>
                    <span className="text-[8px] text-zinc-500 absolute -bottom-1 font-mono uppercase">
                      /100
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-zinc-200">
                      Overall Score
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Suggested:{' '}
                      <span className="text-white font-medium uppercase font-mono">
                        {recommendation?.k}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-scores Bars */}
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                      <span>Sharpness</span>
                      <span className="text-zinc-200">{photo.ai.sh}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-300 transition-all duration-300"
                        style={{ width: `${photo.ai.sh}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                      <span>Exposure</span>
                      <span className="text-zinc-200">{photo.ai.ex}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-300 transition-all duration-300"
                        style={{ width: `${photo.ai.ex}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                      <span>Composition</span>
                      <span className="text-zinc-200">{photo.ai.co}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-300 transition-all duration-300"
                        style={{ width: `${photo.ai.co}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Explanation Text */}
                <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-850 text-xs text-zinc-400 leading-relaxed space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase">
                    <span>Analysis Summary</span>
                    <span>Conf. {recommendation?.c}%</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    {recommendation?.why}
                  </p>
                </div>
              </div>
            ) : photo.err ? (
              <p className="text-xs text-zinc-500 leading-normal">
                Preview not generated for this raw format. Sorting is still active by filename.
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                Evaluating photo pixels...
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="text-xs text-zinc-500 font-mono py-8 text-center">
          No photo selected
        </div>
      )}
    </aside>
  );
};
