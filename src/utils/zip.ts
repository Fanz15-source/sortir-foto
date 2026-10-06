import { PhotoItem } from '../types';

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(u: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < u.length; i++) {
    c = crcTable[(c ^ u[i]) & 255] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  path: string;
  file?: File | Blob;
  data?: Uint8Array;
}

export async function buildZip(
  items: ZipEntry[],
  onProgress?: (count: number, total: number) => void
): Promise<Blob> {
  const enc = new TextEncoder();
  const parts: (ArrayBuffer | Uint8Array)[] = [];
  const cd: (ArrayBuffer | Uint8Array)[] = [];
  const now = new Date();
  const tm = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dd = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  let offset = 0;
  let i = 0;

  for (const it of items) {
    let u: Uint8Array;
    if (it.data) {
      u = it.data;
    } else if (it.file) {
      u = new Uint8Array(await it.file.arrayBuffer());
    } else {
      continue;
    }

    const crc = crc32(u);
    const sz = u.length;
    const nb = enc.encode(it.path);

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true);
    lh.setUint16(10, tm, true);
    lh.setUint16(12, dd, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, sz, true);
    lh.setUint32(22, sz, true);
    lh.setUint16(26, nb.length, true);

    parts.push(lh.buffer, nb, u);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(12, tm, true);
    ch.setUint16(14, dd, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, sz, true);
    ch.setUint32(24, sz, true);
    ch.setUint16(28, nb.length, true);
    ch.setUint32(42, offset, true);

    cd.push(ch.buffer, nb);
    offset += 30 + nb.length + sz;

    i++;
    if (onProgress && i % 5 === 0) {
      onProgress(i, items.length);
    }
  }

  let cds = 0;
  cd.forEach((x) => (cds += (x as ArrayBuffer).byteLength || (x as Uint8Array).length));

  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, items.length, true);
  e.setUint16(10, items.length, true);
  e.setUint32(12, cds, true);
  e.setUint32(16, offset, true);

  return new Blob([...parts, ...cd, e.buffer] as BlobPart[], { type: 'application/zip' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export function generateCSVReport(photos: PhotoItem[], projectName: string): string {
  const headers = ['Filename', 'Status', 'AI Score', 'Sharpness', 'Exposure', 'Composition', 'Favorite', 'Flagged', 'Exported At'];
  const rows = photos.map((p) => [
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.st.toUpperCase()}"`,
    p.ai ? p.ai.o : '',
    p.ai ? p.ai.sh : '',
    p.ai ? p.ai.ex : '',
    p.ai ? p.ai.co : '',
    p.fav ? 'YES' : 'NO',
    p.fl ? 'YES' : 'NO',
    `"${new Date().toISOString()}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportJSON(photos: PhotoItem[], projectName: string): void {
  const data = photos.map((p) => ({
    filename: p.name,
    status: p.st,
    aiScore: p.ai?.o ?? null,
    sharpness: p.ai?.sh ?? null,
    exposure: p.ai?.ex ?? null,
    composition: p.ai?.co ?? null,
    favorite: p.fav,
    flagged: p.fl,
    exportedAt: new Date().toISOString(),
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${projectName || 'photos'}_export.json`);
}
