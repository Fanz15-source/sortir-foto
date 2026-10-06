export type SortStatus = 'unsorted' | 'good' | 'alt' | 'reject';

export interface AIScore {
  sh: number;      // Sharpness (0-100)
  ex: number;      // Exposure (0-100)
  co: number;      // Composition (0-100)
  o: number;       // Overall score (0-100)
  mean: number;    // Mean brightness (0-255)
  hi: number;      // Highlight clipping ratio
  lo: number;      // Shadow clipping ratio
  hash: string;    // 64-bit perceptual hash
}

export interface AIRecommendation {
  k: 'good' | 'alt' | 'reject';
  c: number; // confidence (0-100)
  why: string;
}

export interface PhotoItem {
  id: string | number;
  name: string;
  file: File | Blob;
  st: SortStatus;
  fav: boolean;
  fl: boolean;
  thumb?: string;
  w?: number;
  h?: number;
  ai?: AIScore;
  done?: boolean;
  busy?: boolean;
  err?: boolean;
  cp?: 'ok' | 'fail' | null;
  grp?: number;
  isSample?: boolean;
}

export type FilterKey =
  | 'all'
  | 'unsorted'
  | 'good'
  | 'alt'
  | 'reject'
  | 'aigood'
  | 'low'
  | 'fav'
  | 'flag'
  | 'dup'
  | 'match';

export interface AIThresholds {
  good: number;
  alt: number;
}

export interface HistoryEntry {
  items: Array<{
    photoId: string | number;
    prevStatus: SortStatus;
    newStatus: SortStatus;
  }>;
  type: 'status' | 'fav' | 'flag';
}
