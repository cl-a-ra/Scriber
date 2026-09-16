import { QuoteItem } from '../types/quote';
import { ART_ASSETS } from './assets';

export async function exportQuoteAsImage(
  quote: QuoteItem,
  darkMode: boolean = false
): Promise<string> {
  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 1080;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Background
  if (quote.backgroundStyle === 'reggae-roots-art') {
    await drawImageCover(ctx, ART_ASSETS.reggaeRoots, width, height, 0.9);
  } else if (quote.backgroundStyle === 'locs-crown-art') {
    await drawImageCover(ctx, ART_ASSETS.locsCrown, width, height, 0.9);
  } else if (quote.backgroundStyle === 'genz-aesthetic-art') {
    await drawImageCover(ctx, ART_ASSETS.genzAesthetic, width, height, 0.9);
  } else if (quote.backgroundStyle === 'gradient-earth') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, darkMode ? '#26201c' : '#f8f2ea');
    grad.addColorStop(1, darkMode ? '#12100f' : '#e4d3c0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (quote.backgroundStyle === 'gradient-terracotta') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, darkMode ? '#2f1f18' : '#fdf2eb');
    grad.addColorStop(1, darkMode ? '#160f0c' : '#eed0be');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (quote.backgroundStyle === 'gradient-matcha') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, darkMode ? '#1d261d' : '#f4f7f2');
    grad.addColorStop(1, darkMode ? '#0f140f' : '#d6e3cf');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Linen texture background
    ctx.fillStyle = darkMode ? '#1e1a17' : '#faf7f2';
    ctx.fillRect(0, 0, width, height);
  }

  // Soft overlay card for text legibility
  const cardMargin = 80;
  const cardW = width - cardMargin * 2;
  const cardH = height - cardMargin * 2;
  
  ctx.save();
  ctx.fillStyle = darkMode ? 'rgba(24, 20, 18, 0.88)' : 'rgba(255, 255, 255, 0.92)';
  ctx.strokeStyle = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(120, 90, 60, 0.15)';
  ctx.lineWidth = 2;
  roundRect(ctx, cardMargin, cardMargin, cardW, cardH, 32);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Draw Header Badge & Logo
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = quote.accentColor || '#c98a4b';
  ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
  const badge = quote.vibeBadge ? quote.vibeBadge.toUpperCase() : 'SCRIBER INSPIRATION';
  ctx.fillText(`• ${badge} •`, width / 2, cardMargin + 70);

  // Decorative Accent bar
  ctx.fillStyle = quote.accentColor || '#c98a4b';
  ctx.fillRect(width / 2 - 30, cardMargin + 95, 60, 3);
  ctx.restore();

  // Quote Mark
  ctx.save();
  ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(120,90,60,0.08)';
  ctx.font = 'italic 700 160px "Playfair Display", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('“', width / 2, cardMargin + 220);
  ctx.restore();

  // Draw Quote Text (wrapped)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = darkMode ? '#f3ece6' : '#261f1b';

  let fontName = 'Fraunces, serif';
  if (quote.fontFamily === 'syne') fontName = 'Syne, sans-serif';
  if (quote.fontFamily === 'playfair') fontName = 'Playfair Display, serif';
  if (quote.fontFamily === 'mono') fontName = 'Space Mono, monospace';
  if (quote.fontFamily === 'hand') fontName = 'Caveat, cursive';
  if (quote.fontFamily === 'reggae') fontName = 'Abril Fatface, cursive';

  const fontSize = quote.text.length > 120 ? 38 : quote.text.length > 70 ? 44 : 52;
  ctx.font = `500 ${fontSize}px ${fontName}`;
  const lineHeight = fontSize * 1.45;

  const lines = wrapText(ctx, `“${quote.text}”`, cardW - 140);
  const totalTextHeight = lines.length * lineHeight;
  const startY = height / 2 - totalTextHeight / 2 + 10;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], width / 2, startY + i * lineHeight);
  }
  ctx.restore();

  // Draw Author
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = darkMode ? '#c2b6ac' : '#6b5c53';
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`— ${quote.authorName || 'Anonymous'}`, width / 2, height - cardMargin - 90);

  // Footer branding
  ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(60,50,40,0.4)';
  ctx.font = '500 16px "Space Mono", monospace';
  ctx.fillText('Created with Scriber • Words with Roots & Soul', width / 2, height - cardMargin - 45);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  src: string,
  w: number,
  h: number,
  opacity: number = 1
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.globalAlpha = opacity;
      // Object cover calculation
      const imgRatio = img.width / img.height;
      const canvasRatio = w / h;
      let drawW = w;
      let drawH = h;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawW = h * imgRatio;
        offsetX = (w - drawW) / 2;
      } else {
        drawH = w / imgRatio;
        offsetY = (h - drawH) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      ctx.restore();
      resolve();
    };
    img.onerror = () => {
      // Fallback solid fill if image fails to load
      ctx.fillStyle = '#f4ede4';
      ctx.fillRect(0, 0, w, h);
      resolve();
    };
    img.src = src;
  });
}
