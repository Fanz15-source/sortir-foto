import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  PhotoItem,
  FilterKey,
  SortStatus,
  AIThresholds,
  HistoryEntry,
} from './types';
import { processPhotoAI, computeSimilarityGroups, getAIRecommendation } from './utils/ai';
import { buildZip, downloadBlob, generateCSVReport, exportJSON } from './utils/zip';
import { createSamplePhotos } from './utils/sampleData';
import { idbGet, idbSet, idbDelete } from './utils/db';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PhotoViewer } from './components/PhotoViewer';
import { Filmstrip } from './components/Filmstrip';
import { GridView } from './components/GridView';
import { ActionBar } from './components/ActionBar';
import { Inspector } from './components/Inspector';
import { FinishModal } from './components/FinishModal';
import { ClientListModal } from './components/ClientListModal';
import { HelpModal } from './components/HelpModal';

const EXT_REGEX = /\.(jpe?g|png|webp|tiff?|arw|cr2|cr3|nef|raf|dng)$/i;

export default function App() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [projectName, setProjectName] = useState<string>('');
  const [viewMode, setViewMode] = useState<'filmstrip' | 'grid'>('filmstrip');
  const [rotation, setRotation] = useState<number>(0);

  // Layout & Modals
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);
  const [isFinishOpen, setIsFinishOpen] = useState<boolean>(false);
  const [isClientListOpen, setIsClientListOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Transient interaction feedback
  const [lastReaction, setLastReaction] = useState<{ status: SortStatus; id: number } | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Settings & Thresholds
  const [thresholds, setThresholds] = useState<AIThresholds>({ good: 85, alt: 65 });
  const [autoCopy, setAutoCopy] = useState<boolean>(false);
  const [destFolders, setDestFolders] = useState<Record<string, string>>({});
  const [destHandles, setDestHandles] = useState<Record<string, FileSystemDirectoryHandle>>({});

  // AI batch processing
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzingProgress, setAnalyzingProgress] = useState<{ current: number; total: number } | null>(null);

  // Client matching
  const [matchedIds, setMatchedIds] = useState<Set<string | number> | null>(null);

  // Undo / Redo
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  // Hidden file inputs
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load from IndexedDB (check saved destinations and resume)
  useEffect(() => {
    (async () => {
      const savedDest = await idbGet<Record<string, string>>('saved_dest_names');
      if (savedDest) setDestFolders(savedDest);

      const savedTh = await idbGet<AIThresholds>('ai_thresholds');
      if (savedTh) setThresholds(savedTh);

      // Check first-time visitor for help
      try {
        if (!localStorage.getItem('ps_has_seen_help')) {
          localStorage.setItem('ps_has_seen_help', '1');
          setTimeout(() => setIsHelpOpen(true), 600);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // Save decisions whenever photos change
  useEffect(() => {
    if (!projectName || photos.length === 0) return;
    const saveTimer = setTimeout(() => {
      const stateObj: Record<string, [SortStatus, number, number]> = {};
      photos.forEach((p) => {
        if (p.st !== 'unsorted' || p.fav || p.fl) {
          stateObj[p.name] = [p.st, p.fav ? 1 : 0, p.fl ? 1 : 0];
        }
      });
      idbSet(`decisions:${projectName}`, stateObj);
    }, 400);

    return () => clearTimeout(saveTimer);
  }, [photos, projectName]);

  // Compute similarity groups if filter is 'dup'
  useEffect(() => {
    if (filter === 'dup') {
      computeSimilarityGroups(photos);
    }
  }, [filter, photos]);

  // 2. Filter & Search Pipeline
  const filteredPhotos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return photos.filter((p) => {
      // Search matching
      if (q && !p.name.toLowerCase().includes(q)) return false;

      // Filter matching
      switch (filter) {
        case 'unsorted':
          return p.st === 'unsorted';
        case 'good':
          return p.st === 'good';
        case 'alt':
          return p.st === 'alt';
        case 'reject':
          return p.st === 'reject';
        case 'aigood':
          return p.ai ? getAIRecommendation(p, thresholds).k === 'good' : false;
        case 'low':
          return p.ai ? getAIRecommendation(p, thresholds).c < 60 : false;
        case 'fav':
          return p.fav;
        case 'flag':
          return p.fl;
        case 'dup':
          return !!p.grp && p.grp > 0;
        case 'match':
          return matchedIds ? matchedIds.has(p.id) : false;
        case 'all':
        default:
          return true;
      }
    });
  }, [photos, filter, searchQuery, thresholds, matchedIds]);

  // Ensure current index is valid
  useEffect(() => {
    if (filteredPhotos.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= filteredPhotos.length) {
      setCurrentIndex(filteredPhotos.length - 1);
    }
  }, [filteredPhotos.length, currentIndex]);

  const currentPhoto = filteredPhotos[currentIndex] || null;

  // 3. Background Lazy AI Evaluation for adjacent photos
  useEffect(() => {
    if (!currentPhoto) return;

    // Process current photo and next 2 photos
    const queue = [
      currentPhoto,
      filteredPhotos[currentIndex + 1],
      filteredPhotos[currentIndex + 2],
    ].filter((p): p is PhotoItem => !!p && !p.done && !p.busy);

    if (queue.length === 0) return;

    let isMounted = true;
    (async () => {
      for (const item of queue) {
        if (!isMounted) break;
        const updated = await processPhotoAI(item);
        if (isMounted) {
          setPhotos((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentPhoto, currentIndex, filteredPhotos]);

  // 4. Batch AI Analysis
  const handleAnalyzeAll = async () => {
    const unanalyzed = photos.filter((p) => !p.done);
    if (unanalyzed.length === 0) {
      setStatusNotification('Semua foto sudah dianalisis AI.');
      setTimeout(() => setStatusNotification(null), 3000);
      return;
    }

    setIsAnalyzing(true);
    setAnalyzingProgress({ current: 0, total: unanalyzed.length });

    let count = 0;
    for (const item of unanalyzed) {
      const updated = await processPhotoAI(item);
      count++;
      setAnalyzingProgress({ current: count, total: unanalyzed.length });
      setPhotos((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      // Yield to UI loop
      await new Promise((res) => setTimeout(res, 10));
    }

    setIsAnalyzing(false);
    setAnalyzingProgress(null);
    setStatusNotification(`${unanalyzed.length} foto berhasil dianalisis.`);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  // 5. Accept AI Suggestions
  const handleAcceptAI = () => {
    const candidates = photos.filter((p) => p.st === 'unsorted' && p.ai);
    if (candidates.length === 0) {
      alert('Analisis foto terlebih dahulu sebelum menerapkan rekomendasi AI.');
      return;
    }

    const confirmed = window.confirm(
      `Terapkan rekomendasi AI untuk ${candidates.length} foto yang belum disortir? (Dapat di-undo dengan Ctrl+Z)`
    );
    if (!confirmed) return;

    const historyItems: Array<{
      photoId: string | number;
      prevStatus: SortStatus;
      newStatus: SortStatus;
    }> = [];

    const updatedPhotos = photos.map((p) => {
      if (p.st === 'unsorted' && p.ai) {
        const rec = getAIRecommendation(p, thresholds);
        historyItems.push({
          photoId: p.id,
          prevStatus: 'unsorted',
          newStatus: rec.k,
        });
        return { ...p, st: rec.k };
      }
      return p;
    });

    setUndoStack((prev) => [...prev, { items: historyItems, type: 'status' }]);
    setRedoStack([]);
    setPhotos(updatedPhotos);

    setStatusNotification(`Rekomendasi AI diterapkan pada ${candidates.length} foto.`);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  // 6. Decision Maker (Good / Alt / Reject)
  const handleDecide = useCallback(
    (newStatus: 'good' | 'alt' | 'reject') => {
      // Multiple selection mode
      if (selectedIds.size > 0) {
        const targetIds = new Set(selectedIds);
        const historyItems: Array<{
          photoId: string | number;
          prevStatus: SortStatus;
          newStatus: SortStatus;
        }> = [];

        setPhotos((prev) =>
          prev.map((p) => {
            if (targetIds.has(p.id) && p.st !== newStatus) {
              historyItems.push({
                photoId: p.id,
                prevStatus: p.st,
                newStatus,
              });
              return { ...p, st: newStatus };
            }
            return p;
          })
        );

        if (historyItems.length > 0) {
          setUndoStack((prev) => [...prev, { items: historyItems, type: 'status' }]);
          setRedoStack([]);
        }
        setSelectedIds(new Set());
        setLastReaction({ status: newStatus, id: Date.now() });
        return;
      }

      // Single photo active mode
      if (!currentPhoto) return;

      const prevStatus = currentPhoto.st;
      if (prevStatus === newStatus) {
        // Just advance to next photo
        setCurrentIndex((idx) => Math.min(idx + 1, filteredPhotos.length - 1));
        return;
      }

      const historyItem = {
        photoId: currentPhoto.id,
        prevStatus,
        newStatus,
      };

      setPhotos((prev) =>
        prev.map((p) => (p.id === currentPhoto.id ? { ...p, st: newStatus } : p))
      );

      setUndoStack((prev) => [...prev, { items: [historyItem], type: 'status' }]);
      setRedoStack([]);
      setLastReaction({ status: newStatus, id: Date.now() });

      // Automatically advance to the next photo
      setCurrentIndex((idx) => {
        if (filter !== 'all' && filter === 'unsorted') {
          return Math.min(idx, Math.max(0, filteredPhotos.length - 2));
        }
        return Math.min(idx + 1, filteredPhotos.length - 1);
      });
    },
    [selectedIds, currentPhoto, filteredPhotos.length, filter]
  );

  // 7. Undo / Redo
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const entry = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);

    const lookup = new Map(entry.items.map((i) => [i.photoId, i.prevStatus]));

    setPhotos((prev) =>
      prev.map((p) => {
        if (lookup.has(p.id)) {
          return { ...p, st: lookup.get(p.id)! };
        }
        return p;
      })
    );

    setUndoStack(newUndo);
    setRedoStack((prev) => [...prev, entry]);
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);

    const lookup = new Map(entry.items.map((i) => [i.photoId, i.newStatus]));

    setPhotos((prev) =>
      prev.map((p) => {
        if (lookup.has(p.id)) {
          return { ...p, st: lookup.get(p.id)! };
        }
        return p;
      })
    );

    setRedoStack(newRedo);
    setUndoStack((prev) => [...prev, entry]);
  }, [redoStack]);

  // 8. Toggles: Favorite and Flag
  const handleToggleFavorite = useCallback(() => {
    if (!currentPhoto) return;
    setPhotos((prev) =>
      prev.map((p) => (p.id === currentPhoto.id ? { ...p, fav: !p.fav } : p))
    );
  }, [currentPhoto]);

  const handleToggleFlag = useCallback(() => {
    if (!currentPhoto) return;
    setPhotos((prev) =>
      prev.map((p) => (p.id === currentPhoto.id ? { ...p, fl: !p.fl } : p))
    );
  }, [currentPhoto]);

  // 9. Finish Button & Reset All Tasks (The User's Core Request)
  const handleResetTasks = () => {
    if (photos.length === 0) return;

    // Reset all decisions back to 'unsorted', clear favorites and flags
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        st: 'unsorted',
        fav: false,
        fl: false,
        cp: null,
      }))
    );

    // Clear undo and redo stacks
    setUndoStack([]);
    setRedoStack([]);
    setSelectedIds(new Set());
    setFilter('all');
    setCurrentIndex(0);

    // Delete stored decisions for current project in indexedDB
    if (projectName) {
      idbDelete(`decisions:${projectName}`);
    }

    setStatusNotification('Semua tugas berhasil diselesaikan dan direset kembali ke awal.');
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // 10. Ingest Source Photos
  const loadFileList = async (name: string, files: File[]) => {
    const validFiles = files
      .filter((f) => EXT_REGEX.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    if (validFiles.length === 0) {
      alert('Tidak ditemukan file foto yang didukung pada folder tersebut.');
      return;
    }

    const savedDecisions = (await idbGet<Record<string, [SortStatus, number, number]>>(`decisions:${name}`)) || {};

    const items: PhotoItem[] = validFiles.map((file, i) => {
      const dec = savedDecisions[file.name] || ['unsorted', 0, 0];
      return {
        id: `${file.name}-${file.size}-${i}`,
        name: file.name,
        file,
        st: dec[0],
        fav: dec[1] === 1,
        fl: dec[2] === 1,
        done: false,
      };
    });

    setPhotos(items);
    setProjectName(name);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedIds(new Set());
    setFilter(items.some((p) => p.st !== 'unsorted') ? 'unsorted' : 'all');
    setCurrentIndex(0);
    setSearchQuery('');
  };

  const handleOpenFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker({ mode: 'read' });
        const files: File[] = [];
        for await (const entry of handle.values()) {
          if (entry.kind === 'file' && EXT_REGEX.test(entry.name)) {
            files.push(await entry.getFile());
          }
        }
        await loadFileList(handle.name, files);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Fallback to input
          folderInputRef.current?.click();
        }
      }
    } else {
      folderInputRef.current?.click();
    }
  };

  const handlePickFiles = () => {
    filesInputRef.current?.click();
  };

  const handleLoadSamples = async () => {
    const samples = await createSamplePhotos();
    setPhotos(samples);
    setProjectName('Monochrome Studio Demo');
    setUndoStack([]);
    setRedoStack([]);
    setSelectedIds(new Set());
    setFilter('all');
    setCurrentIndex(0);
    setSearchQuery('');
    setStatusNotification('Galeri demo siap untuk diuji coba!');
    setTimeout(() => setStatusNotification(null), 3000);
  };

  // 11. Destination Folder Management (Direct folder copying)
  const handlePickDest = async (cat: 'good' | 'alt' | 'reject') => {
    if (!('showDirectoryPicker' in window)) {
      alert('Browser Anda tidak mendukung File System Access. Gunakan Chrome/Edge di desktop untuk copy langsung, atau gunakan Download ZIP.');
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setDestFolders((prev) => {
        const next = { ...prev, [cat]: handle.name };
        idbSet('saved_dest_names', next);
        return next;
      });
      setDestHandles((prev) => ({ ...prev, [cat]: handle }));
      setStatusNotification(`Folder untuk ${cat.toUpperCase()} diatur ke: ${handle.name}`);
      setTimeout(() => setStatusNotification(null), 3000);
    } catch {
      // user aborted
    }
  };

  const handleCreateFolders = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('Fitur pembuatan folder langsung membutuhkan browser Chrome atau Edge di desktop.');
      return;
    }
    try {
      const parentHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      const goodH = await parentHandle.getDirectoryHandle('SELECT', { create: true });
      const altH = await parentHandle.getDirectoryHandle('ALTERNATIVE', { create: true });
      const rejectH = await parentHandle.getDirectoryHandle('REJECT', { create: true });

      const newNames = { good: goodH.name, alt: altH.name, reject: rejectH.name };
      setDestFolders(newNames);
      idbSet('saved_dest_names', newNames);
      setDestHandles({ good: goodH, alt: altH, reject: rejectH });

      setStatusNotification(`Folder SELECT, ALTERNATIVE, REJECT berhasil dibuat di "${parentHandle.name}".`);
      setTimeout(() => setStatusNotification(null), 3500);
    } catch {
      // Aborted
    }
  };

  // 12. Export Tools
  const handleDownloadZip = async () => {
    const sorted = photos.filter((p) => p.st !== 'unsorted');
    if (sorted.length === 0) {
      alert('Sortir beberapa foto terlebih dahulu sebelum mengunduh ZIP.');
      return;
    }

    setStatusNotification('Membangun file ZIP...');
    try {
      const entries = sorted.map((p) => ({
        path: `${p.st.toUpperCase()}/${p.name}`,
        file: p.file,
      }));

      // Include report
      const csvStr = generateCSVReport(photos, projectName);
      entries.push({
        path: '_SORTING_REPORT.csv',
        data: new TextEncoder().encode(csvStr),
      } as any);

      const blob = await buildZip(entries, (count, total) => {
        setStatusNotification(`Membangun ZIP: ${count} / ${total} files...`);
      });

      downloadBlob(blob, `${projectName || 'photos'}_sorted.zip`);
      setStatusNotification('ZIP berhasil diunduh!');
      setTimeout(() => setStatusNotification(null), 3000);
    } catch (err) {
      alert('Gagal membuat ZIP. Pastikan memori browser mencukupi.');
      setStatusNotification(null);
    }
  };

  const handleExportCSV = () => {
    if (photos.length === 0) return;
    const csvContent = generateCSVReport(photos, projectName);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${projectName || 'photos'}_report.csv`);
  };

  const handleExportJSON = () => {
    if (photos.length === 0) return;
    exportJSON(photos, projectName);
  };

  // 13. Client list zip export
  const handleDownloadMatchedZip = async (matched: PhotoItem[], notFound: string[]) => {
    setStatusNotification('Membangun ZIP pilihan klien...');
    try {
      const entries = matched.map((p) => ({
        path: `Client_Selection/${p.name}`,
        file: p.file,
      }));

      if (notFound.length > 0) {
        const nfContent = `Nama file yang tidak ditemukan:\n${notFound.join('\n')}`;
        entries.push({
          path: '_NOT_FOUND.txt',
          data: new TextEncoder().encode(nfContent),
        } as any);
      }

      const blob = await buildZip(entries);
      downloadBlob(blob, `${projectName || 'photos'}_client_selection.zip`);
      setStatusNotification('ZIP pilihan klien berhasil diunduh!');
      setTimeout(() => setStatusNotification(null), 3000);
    } catch {
      alert('Gagal mengunduh ZIP pilihan klien.');
      setStatusNotification(null);
    }
  };

  // 14. Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if modal is open or typing in text input
      if (isFinishOpen || isClientListOpen || isHelpOpen) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Meta / Ctrl combinations
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
          return;
        }
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          const searchInput = document.querySelector('header input[type="search"]') as HTMLInputElement;
          searchInput?.focus();
          return;
        }
      }

      const key = e.key.toLowerCase();
      switch (key) {
        case '1':
          e.preventDefault();
          handleDecide('good');
          break;
        case '2':
          e.preventDefault();
          handleDecide('alt');
          break;
        case '3':
          e.preventDefault();
          handleDecide('reject');
          break;
        case 'arrowright':
          e.preventDefault();
          setCurrentIndex((idx) => Math.min(idx + 1, filteredPhotos.length - 1));
          break;
        case 'arrowleft':
          e.preventDefault();
          setCurrentIndex((idx) => Math.max(idx - 1, 0));
          break;
        case 's':
          e.preventDefault();
          handleToggleFavorite();
          break;
        case 'x':
          e.preventDefault();
          handleToggleFlag();
          break;
        case 'r':
          e.preventDefault();
          setRotation((r) => (r + 90) % 360);
          break;
        case 'f':
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
          } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
          }
          break;
        case 'v':
          e.preventDefault();
          setViewMode((m) => (m === 'filmstrip' ? 'grid' : 'filmstrip'));
          break;
        case 'h':
        case '?':
          e.preventDefault();
          setIsHelpOpen(true);
          break;
        case 'escape':
          setSelectedIds(new Set());
          break;
        case 'g':
          setFilter('good');
          break;
        case 'a':
          setFilter('alt');
          break;
        case 'd':
          setFilter('reject');
          break;
        case 'u':
          setFilter('unsorted');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFinishOpen,
    isClientListOpen,
    isHelpOpen,
    handleDecide,
    handleUndo,
    handleRedo,
    handleToggleFavorite,
    handleToggleFlag,
    filteredPhotos.length,
  ]);

  // Counts for sidebar
  const counts = useMemo<Record<FilterKey, number>>(() => {
    return {
      all: photos.length,
      unsorted: photos.filter((p) => p.st === 'unsorted').length,
      good: photos.filter((p) => p.st === 'good').length,
      alt: photos.filter((p) => p.st === 'alt').length,
      reject: photos.filter((p) => p.st === 'reject').length,
      aigood: photos.filter((p) => (p.ai ? getAIRecommendation(p, thresholds).k === 'good' : false)).length,
      low: photos.filter((p) => (p.ai ? getAIRecommendation(p, thresholds).c < 60 : false)).length,
      fav: photos.filter((p) => p.fav).length,
      flag: photos.filter((p) => p.fl).length,
      dup: photos.filter((p) => !!p.grp && p.grp > 0).length,
      match: matchedIds ? photos.filter((p) => matchedIds.has(p.id)).length : 0,
    };
  }, [photos, thresholds, matchedIds]);

  const sortedCount = photos.length - counts.unsorted;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans select-none">
      {/* Hidden file inputs for fallbacks */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            const fName = (files[0].webkitRelativePath || 'Folder').split('/')[0];
            loadFileList(fName, files);
          }
        }}
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={filesInputRef}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            loadFileList(`Selected (${files.length})`, files);
          }
        }}
        multiple
        accept="image/*,.arw,.cr2,.cr3,.nef,.raf,.dng"
        className="hidden"
      />

      {/* Top Header */}
      <Header
        projectName={projectName}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => {}}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((m) => (m === 'filmstrip' ? 'grid' : 'filmstrip'))}
        onOpenFolder={handleOpenFolder}
        onLoadSamples={handleLoadSamples}
        onOpenClientList={() => setIsClientListOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenFinish={() => setIsFinishOpen(true)}
        onOpenReset={handleResetTasks}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        totalPhotos={photos.length}
        sortedCount={sortedCount}
      />

      {/* Status banner / Notification */}
      {statusNotification && (
        <div className="bg-zinc-900 border-b border-zinc-800 text-xs px-4 py-1.5 flex items-center justify-between text-zinc-200 font-mono tracking-tight transition-all duration-200 z-20">
          <span>{statusNotification}</span>
          <button
            onClick={() => setStatusNotification(null)}
            className="text-zinc-500 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Library & Tools Sidebar */}
        <Sidebar
          currentFilter={filter}
          onSelectFilter={(f) => {
            setFilter(f);
            setCurrentIndex(0);
          }}
          counts={counts}
          totalPhotos={photos.length}
          onAnalyzeAll={handleAnalyzeAll}
          onAcceptAI={handleAcceptAI}
          isAnalyzing={isAnalyzing}
          analyzingProgress={analyzingProgress}
          onDownloadZip={handleDownloadZip}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
          onRefresh={handleOpenFolder}
          onResetAll={handleResetTasks}
          thresholds={thresholds}
          onThresholdsChange={(t) => {
            setThresholds(t);
            idbSet('ai_thresholds', t);
          }}
          destFolders={destFolders}
          onPickDest={handlePickDest}
          onCreateFolders={handleCreateFolders}
          autoCopy={autoCopy}
          onToggleAutoCopy={setAutoCopy}
          isOpenMobile={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Center Stage: Photo Viewer or Full Grid */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
          {viewMode === 'filmstrip' ? (
            <>
              <PhotoViewer
                currentPhoto={currentPhoto}
                currentIndex={currentIndex}
                totalInView={filteredPhotos.length}
                rotation={rotation}
                onRotate={() => setRotation((r) => (r + 90) % 360)}
                onOpenFolder={handleOpenFolder}
                onLoadSamples={handleLoadSamples}
                onPickFiles={handlePickFiles}
                lastReaction={lastReaction}
                onToggleFullscreen={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                    setIsFullscreen(true);
                  } else {
                    document.exitFullscreen().catch(() => {});
                    setIsFullscreen(false);
                  }
                }}
                isFullscreen={isFullscreen}
              />

              <Filmstrip
                photos={filteredPhotos}
                currentIndex={currentIndex}
                onSelectPhoto={(idx) => setCurrentIndex(idx)}
                selectedIds={selectedIds}
                onToggleSelection={(id, multi) => {
                  setSelectedIds((prev) => {
                    const next = new Set(multi ? prev : []);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  });
                }}
              />
            </>
          ) : (
            <GridView
              photos={filteredPhotos}
              currentIndex={currentIndex}
              onSelectPhoto={(idx) => setCurrentIndex(idx)}
              onOpenViewer={(idx) => {
                setCurrentIndex(idx);
                setViewMode('filmstrip');
              }}
              selectedIds={selectedIds}
              onToggleSelection={(id, multi) => {
                setSelectedIds((prev) => {
                  const next = new Set(multi ? prev : []);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
            />
          )}
        </div>

        {/* Right Inspector Sidebar */}
        <Inspector
          photo={currentPhoto}
          thresholds={thresholds}
          isOpen={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
        />
      </div>

      {/* Bottom Sticky Action Bar */}
      <ActionBar
        onDecide={handleDecide}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onToggleFavorite={handleToggleFavorite}
        onToggleFlag={handleToggleFlag}
        currentPhoto={currentPhoto}
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onToggleInspector={() => setInspectorOpen(!inspectorOpen)}
        inspectorOpen={inspectorOpen}
      />

      {/* Modals */}
      <FinishModal
        isOpen={isFinishOpen}
        onClose={() => setIsFinishOpen(false)}
        photos={photos}
        projectName={projectName}
        onDownloadZip={handleDownloadZip}
        onExportCSV={handleExportCSV}
        onResetTasks={handleResetTasks}
      />

      <ClientListModal
        isOpen={isClientListOpen}
        onClose={() => setIsClientListOpen(false)}
        photos={photos}
        onApplyMatchFilter={(matched) => {
          setMatchedIds(matched);
          setFilter('match');
          setCurrentIndex(0);
        }}
        onDownloadMatchedZip={handleDownloadMatchedZip}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
