import { AIScore, AIRecommendation, AIThresholds, PhotoItem } from '../types';

export const clamp = (v: number, a = 0, b = 100): number => Math.max(a, Math.min(b, v));

export function analyzeCanvas(gray: Uint8Array, w: number, h: number): AIScore {
  let sum = 0;
  let lo = 0;
  let hi = 0;
  const n = w * h;

  for (let i = 0; i < n; i++) {
    const v = gray[i];
    sum += v;
    if (v < 8) lo++;
    if (v > 247) hi++;
  }

  let ls = 0;
  let ls2 = 0;
  let cnt = 0;
  let cx = 0;
  let cy = 0;
  let ce = 0;

  // Discrete Laplacian edge detection
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const l = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      ls += l;
      ls2 += l * l;
      cnt++;

      const gm = Math.abs(gray[i + 1] - gray[i - 1]) + Math.abs(gray[i + w] - gray[i - w]);
      ce += gm;
      cx += gm * x;
      cy += gm * y;
    }
  }

  const v = cnt ? ls2 / cnt - Math.pow(ls / cnt, 2) : 0;
  const mean = sum / n;
  const sharp = clamp(Math.log10(v + 1) / 2.6 * 100);
  const exp = clamp(100 - Math.abs(mean - 118) * 0.7 - (hi / n) * 200 - (lo / n) * 150);

  let comp = 50;
  if (ce > 0) {
    const ux = cx / ce / w;
    const uy = cy / ce / h;
    const pts: [number, number][] = [
      [0.5, 0.5],
      [1 / 3, 1 / 3],
      [2 / 3, 1 / 3],
      [1 / 3, 2 / 3],
      [2 / 3, 2 / 3],
    ];
    const d = Math.min(...pts.map((p) => Math.hypot(ux - p[0], uy - p[1])));
    comp = clamp(100 - d * 180);
  }

  // 64-bit perceptual hash (8x8)
  let hash = '';
  for (let y = 0; y < 8; y++) {
    const yy = Math.floor(((y + 0.5) / 8) * h) * w;
    for (let x = 0; x < 8; x++) {
      const p1 = gray[yy + Math.floor(((x + 0.5) / 9) * w)];
      const p2 = gray[yy + Math.floor(((x + 1.5) / 9) * w)];
      hash += p1 > p2 ? '1' : '0';
    }
  }

  return {
    sh: Math.round(sharp),
    ex: Math.round(exp),
    co: Math.round(comp),
    o: Math.round(0.5 * sharp + 0.3 * exp + 0.2 * comp),
    mean: Math.round(mean),
    hi: hi / n,
    lo: lo / n,
    hash,
  };
}

export function getAIRecommendation(p: PhotoItem, thresholds: AIThresholds): AIRecommendation {
  if (!p.ai) {
    return { k: 'alt', c: 50, why: 'Belum dianalisis' };
  }
  const a = p.ai;
  const s = a.o;
  const k: 'good' | 'alt' | 'reject' = s >= thresholds.good ? 'good' : s >= thresholds.alt ? 'alt' : 'reject';
  const c = Math.round(Math.min(98, 50 + Math.min(Math.abs(s - thresholds.good), Math.abs(s - thresholds.alt)) * 3.5));

  const reasons: string[] = [];
  if (a.sh >= 72) reasons.push('Fokus subjek sangat tajam');
  else if (a.sh < 45) reasons.push('Objek agak buram/soft');
  else reasons.push('Ketajaman cukup baik');

  if (a.mean < 70) reasons.push('Underexposed (agak gelap)');
  else if (a.mean > 185) reasons.push('Overexposed (terlalu terang)');
  else if (a.ex >= 75) reasons.push('Eksposur seimbang');
  else reasons.push('Gradasi kontras tinggi');

  if (a.hi > 0.05) reasons.push('Highlight clipped');
  if (a.lo > 0.1) reasons.push('Shadow crushed');

  if (a.co >= 70) reasons.push('Komposisi seimbang');
  else if (a.co < 45) reasons.push('Titik fokus di luar rule-of-thirds');

  return {
    k,
    c,
    why: reasons.join(' · ') + '.',
  };
}

export async function processPhotoAI(p: PhotoItem): Promise<PhotoItem> {
  if (p.done || p.busy) return p;
  p.busy = true;
  try {
    const bm = await createImageBitmap(p.file);
    p.w = bm.width;
    p.h = bm.height;

    const maxDim = 200;
    const sc = Math.min(1, maxDim / Math.max(bm.width, bm.height));
    const w = Math.max(9, Math.round(bm.width * sc));
    const h = Math.max(9, Math.round(bm.height * sc));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas 2d context');

    ctx.drawImage(bm, 0, 0, w, h);
    bm.close();

    const imgData = ctx.getImageData(0, 0, w, h).data;
    const gray = new Uint8Array(w * h);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = Math.round(0.299 * imgData[i * 4] + 0.587 * imgData[i * 4 + 1] + 0.114 * imgData[i * 4 + 2]);
    }

    p.ai = analyzeCanvas(gray, w, h);

    if (!p.thumb) {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.65));
      if (blob) {
        p.thumb = URL.createObjectURL(blob);
      }
    }
    p.done = true;
  } catch (err) {
    p.err = true;
    p.done = true;
  } finally {
    p.busy = false;
  }
  return p;
}

export function computeSimilarityGroups(photos: PhotoItem[]): void {
  const analyzed = photos.filter((p) => p.ai).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  let grpId = 0;
  photos.forEach((p) => (p.grp = 0));

  const hamming = (a: string, b: string): number => {
    let d = 0;
    for (let i = 0; i < 64; i++) {
      if (a[i] !== b[i]) d++;
    }
    return d;
  };

  for (let i = 0; i < analyzed.length; i++) {
    for (let j = Math.max(0, i - 6); j < i; j++) {
      if (analyzed[i].ai && analyzed[j].ai && hamming(analyzed[i].ai!.hash, analyzed[j].ai!.hash) <= 6) {
        analyzed[i].grp = analyzed[j].grp || (analyzed[j].grp = ++grpId);
      }
    }
  }
}
