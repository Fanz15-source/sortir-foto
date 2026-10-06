import React from 'react';
import { Check, Slash, X as CloseIcon, Star, Flag } from 'lucide-react';
import { PhotoItem } from '../types';

interface GridViewProps {
  photos: PhotoItem[];
  currentIndex: number;
  onSelectPhoto: (index: number) => void;
  onOpenViewer: (index: number) => void;
  selectedIds: Set<string | number>;
  onToggleSelection: (id: string | number, multi: boolean) => void;
}

export const GridView: React.FC<GridViewProps> = ({
  photos,
  currentIndex,
  onSelectPhoto,
  onOpenViewer,
  selectedIds,
  onToggleSelection,
}) => {
  if (photos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs font-mono">
        No photos match this filter.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-zinc-950">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {photos.map((photo, index) => {
          const isCurrent = index === currentIndex;
          const isSelected = selectedIds.has(photo.id);

          return (
            <div
              key={photo.id}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                  onToggleSelection(photo.id, true);
                } else {
                  onSelectPhoto(index);
                }
              }}
              onDoubleClick={() => onOpenViewer(index)}
              className={`group relative aspect-square rounded-lg overflow-hidden bg-zinc-900 border cursor-pointer transition-all duration-150 ease-out select-none ${
                isCurrent
                  ? 'border-white ring-2 ring-white/20'
                  : isSelected
                  ? 'border-zinc-300 ring-2 ring-zinc-500/50'
                  : 'border-zinc-800/80 hover:border-zinc-600 hover:-translate-y-0.5'
              }`}
            >
              {photo.thumb ? (
                <img
                  src={photo.thumb}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600 font-mono">
                  Loading...
                </div>
              )}

              {/* Gradient Bottom Scrim */}
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

              {/* Status Indicator */}
              {photo.st !== 'unsorted' && (
                <div className="absolute top-2 right-2">
                  {photo.st === 'good' && (
                    <div className="w-5 h-5 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                  {photo.st === 'alt' && (
                    <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-100 border border-zinc-700 flex items-center justify-center shadow">
                      <Slash className="w-3 h-3" />
                    </div>
                  )}
                  {photo.st === 'reject' && (
                    <div className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center justify-center shadow">
                      <CloseIcon className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              )}

              {/* Star & Flag indicators */}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                {photo.fav && <Star className="w-3.5 h-3.5 text-zinc-200 fill-zinc-200 drop-shadow" />}
                {photo.fl && <Flag className="w-3.5 h-3.5 text-zinc-300 fill-zinc-300 drop-shadow" />}
              </div>

              {/* File Info */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-zinc-300 pointer-events-none">
                <span className="truncate max-w-[90px]">{photo.name}</span>
                {photo.ai && (
                  <span className="text-zinc-400 font-medium">
                    AI {photo.ai.o}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
