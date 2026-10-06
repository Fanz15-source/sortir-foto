import React, { useRef, useEffect } from 'react';
import { Check, Slash, X as CloseIcon, Star, Flag } from 'lucide-react';
import { PhotoItem } from '../types';

interface FilmstripProps {
  photos: PhotoItem[];
  currentIndex: number;
  onSelectPhoto: (index: number) => void;
  selectedIds: Set<string | number>;
  onToggleSelection: (id: string | number, multi: boolean) => void;
}

export const Filmstrip: React.FC<FilmstripProps> = ({
  photos,
  currentIndex,
  onSelectPhoto,
  selectedIds,
  onToggleSelection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex]);

  if (photos.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="h-24 bg-zinc-950 border-t border-zinc-800/80 px-3 py-2 flex items-center gap-2 overflow-x-auto overflow-y-hidden select-none shrink-0"
    >
      {photos.map((photo, index) => {
        const isCurrent = index === currentIndex;
        const isSelected = selectedIds.has(photo.id);

        return (
          <div
            key={photo.id}
            ref={isCurrent ? activeItemRef : undefined}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.shiftKey) {
                onToggleSelection(photo.id, true);
              } else {
                onSelectPhoto(index);
              }
            }}
            className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden cursor-pointer transition-all duration-150 ease-out border ${
              isCurrent
                ? 'border-white ring-2 ring-white/20 scale-105 z-10'
                : isSelected
                ? 'border-zinc-400 ring-1 ring-zinc-500'
                : 'border-zinc-800 hover:border-zinc-600'
            } bg-zinc-900`}
          >
            {photo.thumb ? (
              <img
                src={photo.thumb}
                alt={photo.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 font-mono">
                ...
              </div>
            )}

            {/* Subtle Gradient Scrim at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

            {/* Status indicator on top right */}
            {photo.st !== 'unsorted' && (
              <div className="absolute top-1 right-1">
                {photo.st === 'good' && (
                  <div className="w-4 h-4 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
                {photo.st === 'alt' && (
                  <div className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-100 border border-zinc-700 flex items-center justify-center shadow">
                    <Slash className="w-2.5 h-2.5" />
                  </div>
                )}
                {photo.st === 'reject' && (
                  <div className="w-4 h-4 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center justify-center shadow">
                    <CloseIcon className="w-2.5 h-2.5 stroke-[2.5]" />
                  </div>
                )}
              </div>
            )}

            {/* Star & Flag indicators on top left */}
            <div className="absolute top-1 left-1 flex items-center gap-0.5">
              {photo.fav && <Star className="w-3 h-3 text-zinc-200 fill-zinc-200 drop-shadow" />}
              {photo.fl && <Flag className="w-3 h-3 text-zinc-300 fill-zinc-300 drop-shadow" />}
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[9px] font-mono text-zinc-400 pointer-events-none">
              {photo.ai ? (
                <span className="text-zinc-300 font-medium">AI {photo.ai.o}</span>
              ) : (
                <span className="truncate max-w-[45px]">{photo.name.split('.')[0]}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
