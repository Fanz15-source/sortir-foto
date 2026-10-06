import { PhotoItem } from '../types';

interface SampleSpec {
  name: string;
  title: string;
  theme: 'minimal-arch' | 'mountain-mist' | 'urban-shadow' | 'portrait-profile' | 'botanical-monochrome' | 'coastal-waves' | 'street-silhouette' | 'geometry-facade' | 'studio-still-life' | 'night-skyline';
  w: number;
  h: number;
}

const SAMPLE_SPECS: SampleSpec[] = [
  { name: 'DSC_0102.JPG', title: 'Brutalist Concrete Pavilion', theme: 'minimal-arch', w: 1920, h: 1280 },
  { name: 'DSC_0105.JPG', title: 'Alpine Peak in Heavy Fog', theme: 'mountain-mist', w: 1920, h: 1280 },
  { name: 'DSC_0109.JPG', title: 'Geometric Stairway Shadows', theme: 'urban-shadow', w: 1280, h: 1920 },
  { name: 'DSC_0114.JPG', title: 'Studio Editorial Silhouette', theme: 'portrait-profile', w: 1280, h: 1920 },
  { name: 'DSC_0120.JPG', title: 'Fern Frond High Contrast', theme: 'botanical-monochrome', w: 1920, h: 1280 },
  { name: 'DSC_0123.JPG', title: 'Pacific Swell Long Exposure', theme: 'coastal-waves', w: 1920, h: 1280 },
  { name: 'DSC_0128.JPG', title: 'Tokyo Crosswalk in Rain', theme: 'street-silhouette', w: 1920, h: 1280 },
  { name: 'DSC_0132.JPG', title: 'Linear Glass Tower Facade', theme: 'geometry-facade', w: 1280, h: 1920 },
  { name: 'DSC_0137.JPG', title: 'Ceramic Vessel on Travertine', theme: 'studio-still-life', w: 1920, h: 1280 },
  { name: 'DSC_0142.JPG', title: 'Metropolis Night Haze', theme: 'night-skyline', w: 1920, h: 1080 },
];

function drawSampleCanvas(spec: SampleSpec): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  // Use a balanced resolution for fast rendering & crisp preview
  canvas.width = spec.w > spec.h ? 1200 : 800;
  canvas.height = spec.w > spec.h ? 800 : 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  switch (spec.theme) {
    case 'minimal-arch':
      bgGrad.addColorStop(0, '#1a1a1e');
      bgGrad.addColorStop(0.5, '#2a2b30');
      bgGrad.addColorStop(1, '#0e0f12');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Concrete cantilever
      ctx.fillStyle = '#484a54';
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h);
      ctx.lineTo(w * 0.9, h * 0.2);
      ctx.lineTo(w, h * 0.2);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Sharp shadow
      ctx.fillStyle = '#0b0c0e';
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h);
      ctx.lineTo(w * 0.75, h * 0.35);
      ctx.lineTo(w * 0.85, h);
      ctx.closePath();
      ctx.fill();
      break;

    case 'mountain-mist':
      bgGrad.addColorStop(0, '#e5e7eb');
      bgGrad.addColorStop(0.4, '#9ca3af');
      bgGrad.addColorStop(1, '#374151');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Ridges
      for (let r = 0; r < 4; r++) {
        ctx.fillStyle = `rgba(17, 24, 39, ${0.3 + r * 0.22})`;
        ctx.beginPath();
        ctx.moveTo(0, h * (0.4 + r * 0.15));
        for (let x = 0; x <= w; x += 40) {
          const y = h * (0.4 + r * 0.15) + Math.sin(x * 0.005 + r * 1.5) * 60 + Math.cos(x * 0.012) * 30;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
      }
      break;

    case 'portrait-profile':
      ctx.fillStyle = '#080809';
      ctx.fillRect(0, 0, w, h);

      // Silhouette with soft rim light
      const pGrad = ctx.createRadialGradient(w * 0.65, h * 0.45, 50, w * 0.65, h * 0.45, w * 0.5);
      pGrad.addColorStop(0, '#f4f4f5');
      pGrad.addColorStop(0.4, '#52525b');
      pGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.45, w * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Masking neck and shoulder
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.85, w * 0.38, h * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'urban-shadow':
      ctx.fillStyle = '#f4f4f5';
      ctx.fillRect(0, 0, w, h);
      // Graphic staircase steps
      ctx.fillStyle = '#18181b';
      const steps = 10;
      for (let s = 0; s < steps; s++) {
        ctx.fillRect(w * (s / steps), h * (s / steps), w / steps, h * (1 - s / steps));
      }
      // Diagonal shadow beam
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.7, 0);
      ctx.lineTo(w * 0.3, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      break;

    case 'botanical-monochrome':
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, w, h);
      // Delicate fern ribs
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.9);
      ctx.quadraticCurveTo(w * 0.5, h * 0.5, w * 0.8, h * 0.15);
      ctx.stroke();

      for (let i = 0; i < 24; i++) {
        const t = i / 24;
        const x = w * 0.2 + (w * 0.6) * t;
        const y = h * 0.9 - (h * 0.75) * t;
        ctx.strokeStyle = i % 2 === 0 ? '#fafafa' : '#71717a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (i % 2 === 0 ? 90 : -90) * (1 - t * 0.6), y - 25);
        ctx.stroke();
      }
      break;

    default:
      // High-contrast architectural / street tone
      bgGrad.addColorStop(0, '#27272a');
      bgGrad.addColorStop(0.5, '#09090b');
      bgGrad.addColorStop(1, '#18181b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Fine grid / rule lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Strong central focal subject
      ctx.fillStyle = '#fafafa';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.45, Math.min(w, h) * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.45, Math.min(w, h) * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

  // Add subtle film grain / camera simulation
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i < 6000; i++) {
    const gx = Math.random() * w;
    const gy = Math.random() * h;
    ctx.fillRect(gx, gy, 1.5, 1.5);
  }

  // Quiet clean minimalist camera watermark at bottom right
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillText(`${spec.name} · 50mm f/1.4 · ISO 100`, 30, h - 30);

  return canvas;
}

export async function createSamplePhotos(): Promise<PhotoItem[]> {
  const items: PhotoItem[] = [];

  for (let i = 0; i < SAMPLE_SPECS.length; i++) {
    const spec = SAMPLE_SPECS[i];
    const canvas = drawSampleCanvas(spec);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.88));
    const thumbBlob = await new Promise<Blob>((res) => {
      const tc = document.createElement('canvas');
      tc.width = 160;
      tc.height = 120;
      const tctx = tc.getContext('2d');
      if (tctx) tctx.drawImage(canvas, 0, 0, 160, 120);
      tc.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.6);
    });

    const file = new File([blob], spec.name, { type: 'image/jpeg', lastModified: Date.now() - (SAMPLE_SPECS.length - i) * 60000 });
    const thumbUrl = URL.createObjectURL(thumbBlob);

    items.push({
      id: `sample-${i + 1}`,
      name: spec.name,
      file,
      st: 'unsorted',
      fav: i === 0 || i === 3,
      fl: false,
      thumb: thumbUrl,
      w: spec.w,
      h: spec.h,
      done: false,
      isSample: true,
    });
  }

  return items;
}
