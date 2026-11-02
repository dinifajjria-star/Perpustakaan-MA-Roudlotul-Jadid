import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker if in browser
if (typeof window !== 'undefined') {
  try {
    // Use unpkg CDN matching pdfjs-dist version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker setup note:', e);
  }
}

/**
 * Generates an aesthetic high-resolution canvas thumbnail of Page 1
 * in case PDF rendering is unavailable or as instant fallback.
 */
export function generateCoverCanvasThumbnail(
  title: string,
  schoolName: string = 'MA Roudlotul Jadid'
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 650; // standard A4 book ratio (1:1.414)
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clean paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle outer edge
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Outer border frame
  ctx.strokeStyle = '#047857'; // Deep emerald
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  // Inner thin border
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

  // Top Header Banner
  ctx.fillStyle = '#065f46';
  ctx.fillRect(36, 42, canvas.width - 72, 46);

  // School name in top banner
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(schoolName.toUpperCase(), canvas.width / 2, 71);

  // Sub-badge under banner
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 10px "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PERPUSTAKAAN DIGITAL • DOKUMEN E-BOOK PDF', canvas.width / 2, 114);

  // Center Emblem Circle
  ctx.fillStyle = '#ecfdf5';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 215, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Emblem inner content
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 36px serif';
  ctx.fillText('📖', canvas.width / 2, 228);

  // Book Title in Center (wrapped text)
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 21px "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';

  const words = (title || 'E-Book Perpustakaan').split(' ');
  let line = '';
  const lines: string[] = [];
  const maxWidth = canvas.width - 80;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  // Render title lines (up to 4 lines)
  const startY = 325;
  const lineHeight = 30;
  lines.slice(0, 4).forEach((text, i) => {
    ctx.fillText(text, canvas.width / 2, startY + i * lineHeight);
  });

  // Decorative divider
  const dividerY = startY + Math.min(lines.length, 4) * lineHeight + 18;
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 50, dividerY);
  ctx.lineTo(canvas.width / 2 + 50, dividerY);
  ctx.stroke();

  // "HALAMAN 1" stamp badge at the bottom
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(40, canvas.height - 86, canvas.width - 80, 42);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, canvas.height - 86, canvas.width - 80, 42);

  ctx.fillStyle = '#047857';
  ctx.font = 'bold 12px "Segoe UI", Roboto, sans-serif';
  ctx.fillText('HALAMAN PERTAMA (SAMPUL BUKU PDF)', canvas.width / 2, canvas.height - 60);

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Extracts the first page of a PDF file or blob as a data URL image.
 * Also returns total pages detected in the document.
 */
export async function extractPdfFirstPage(
  fileOrBlob: Blob | File,
  fallbackTitle: string = 'E-Book PDF'
): Promise<{ dataUrl: string; totalPages: number }> {
  try {
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      disableAutoFetch: true,
      disableStream: true,
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages || 1;
    const page = await pdfDoc.getPage(1);

    const baseViewport = page.getViewport({ scale: 1.0 });
    // Scale so width is around 480px for high-definition thumbnail
    const targetScale = Math.max(1, 480 / baseViewport.width);
    const viewport = page.getViewport({ scale: targetScale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    await (page.render as any)({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    return { dataUrl, totalPages };
  } catch (err) {
    console.warn('PDF first page extraction fallback to generated preview:', err);
    return {
      dataUrl: generateCoverCanvasThumbnail(fallbackTitle),
      totalPages: 1,
    };
  }
}
