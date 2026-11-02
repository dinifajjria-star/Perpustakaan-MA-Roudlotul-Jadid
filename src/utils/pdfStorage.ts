import { jsPDF } from 'jspdf';
import { EBook } from '../types/library';

const DB_NAME = 'PustakaRoudlotulJadid_PDF_DB';
const DB_VERSION = 1;
const STORE_NAME = 'ebook_pdf_files';

export interface StoredPdfRecord {
  ebookId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  blob: Blob;
  updatedAt: string;
}

// Keep an active cache of object URLs so we can revoke them when needed
const activeObjectUrls = new Map<string, string>();

/**
 * Open or initialize IndexedDB for persistent PDF storage
 */
export function openPdfDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Browser Anda tidak mendukung IndexedDB untuk penyimpanan file PDF.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'ebookId' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Gagal membuka basis data file PDF'));
    };
  });
}

/**
 * Save an uploaded PDF File or Blob into IndexedDB
 */
export async function savePdfToStorage(
  ebookId: string,
  file: File | Blob,
  customFileName?: string
): Promise<{ success: boolean; size: number; fileName: string; sizeFormatted: string }> {
  const db = await openPdfDatabase();
  const fileName = customFileName || (file instanceof File ? file.name : `ebook_${ebookId}.pdf`);
  const fileSize = file.size;
  const sizeFormatted = formatFileSize(fileSize);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: StoredPdfRecord = {
      ebookId,
      fileName,
      fileType: 'application/pdf',
      fileSize,
      blob: file,
      updatedAt: new Date().toISOString(),
    };

    const putRequest = store.put(record);

    putRequest.onsuccess = () => {
      // Clear old object URL cache if any
      if (activeObjectUrls.has(ebookId)) {
        try {
          URL.revokeObjectURL(activeObjectUrls.get(ebookId)!);
          activeObjectUrls.delete(ebookId);
        } catch {
          // ignore
        }
      }
      resolve({ success: true, size: fileSize, fileName, sizeFormatted });
    };

    putRequest.onerror = () => {
      reject(putRequest.error || new Error('Gagal menyimpan file PDF ke penyimpanan lokal'));
    };
  });
}

/**
 * Retrieve the PDF Blob from IndexedDB
 */
export async function getPdfBlobFromStorage(ebookId: string): Promise<Blob | null> {
  try {
    const db = await openPdfDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(ebookId);

      getRequest.onsuccess = () => {
        const result = getRequest.result as StoredPdfRecord | undefined;
        if (result && result.blob) {
          resolve(result.blob);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error || new Error('Gagal memuat file PDF'));
      };
    });
  } catch (err) {
    console.error('Error fetching PDF blob from IndexedDB:', err);
    return null;
  }
}

/**
 * Get or create a temporary Object URL for reading/rendering PDF
 */
export async function getPdfObjectUrl(ebookId: string): Promise<string | null> {
  if (activeObjectUrls.has(ebookId)) {
    return activeObjectUrls.get(ebookId)!;
  }

  const blob = await getPdfBlobFromStorage(ebookId);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  activeObjectUrls.set(ebookId, url);
  return url;
}

/**
 * Delete a PDF from IndexedDB
 */
export async function deletePdfFromStorage(ebookId: string): Promise<void> {
  try {
    if (activeObjectUrls.has(ebookId)) {
      try {
        URL.revokeObjectURL(activeObjectUrls.get(ebookId)!);
        activeObjectUrls.delete(ebookId);
      } catch {
        // ignore
      }
    }

    const db = await openPdfDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(ebookId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`Error deleting PDF for ebook ${ebookId}:`, err);
  }
}

/**
 * Delete multiple PDFs from IndexedDB (bulk delete)
 */
export async function deleteMultiplePdfsFromStorage(ebookIds: string[]): Promise<void> {
  try {
    for (const id of ebookIds) {
      if (activeObjectUrls.has(id)) {
        try {
          URL.revokeObjectURL(activeObjectUrls.get(id)!);
          activeObjectUrls.delete(id);
        } catch {
          // ignore
        }
      }
    }

    const db = await openPdfDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      ebookIds.forEach((id) => store.delete(id));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error bulk deleting PDFs from IndexedDB:', err);
  }
}

/**
 * Check if PDF exists in IndexedDB
 */
export async function hasPdfInStorage(ebookId: string): Promise<boolean> {
  try {
    const db = await openPdfDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count(ebookId);
      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Format bytes to readable size (e.g. 2.4 MB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generate a clean, real multi-page PDF document on the fly from an EBook
 * (Used for initial books or when viewing an ebook that does not yet have an uploaded PDF)
 */
export function generateEBookPdfBlob(ebook: EBook): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Cover Page
  // Background Header
  doc.setFillColor(15, 81, 50); // Emerald 800
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PERPUSTAKAAN DIGITAL MA ROUDLOTUL JADID', margin, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Koleksi Resmi Buku Teks & Literatur Santri | Madrasah Aliyah Roudlotul Jadid', margin, 26);
  doc.text(`Kategori: ${ebook.category} | Tingkat: ${ebook.gradeLevel}`, margin, 32);

  // Book Title on Cover
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(ebook.title, contentWidth);
  doc.text(titleLines, margin, 65);

  let curY = 65 + titleLines.length * 9;

  // Metadata block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, contentWidth, 38, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('INFORMASI BIBLIOGRAFI:', margin + 6, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Kode Koleksi : ${ebook.code}`, margin + 6, curY + 16);
  doc.text(`Penulis / Penyusun : ${ebook.author}`, margin + 6, curY + 22);
  doc.text(`Penerbit : ${ebook.publisher} (${ebook.publishYear})`, margin + 6, curY + 28);
  if (ebook.isbn) {
    doc.text(`ISBN : ${ebook.isbn}`, margin + 100, curY + 16);
  }
  doc.text(`Tebal Halaman : ${ebook.totalPages} Halaman`, margin + 100, curY + 22);
  doc.text(`Status Dokumen : Dokumen Resmi Terverifikasi`, margin + 100, curY + 28);

  curY += 46;

  // Synopsis Header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 81, 50);
  doc.text('SINOPSIS / RINGKASAN BUKU', margin, curY);
  curY += 6;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const synopsisLines = doc.splitTextToSize(ebook.synopsis || 'Tidak ada sinopsis.', contentWidth);
  doc.text(synopsisLines, margin, curY);
  curY += synopsisLines.length * 5 + 10;

  // Chapters rendering
  const chapters = ebook.chapters && ebook.chapters.length > 0 ? ebook.chapters : [];

  for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
    const ch = chapters[cIdx];

    // Start each chapter on a new page or if Y is low
    if (curY > pageHeight - 60 || cIdx > 0) {
      doc.addPage();
      curY = margin;

      // Small page header
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text(`MA ROUDLOTUL JADID - ${ebook.title.substring(0, 45)}...`, margin, 12);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 14, pageWidth - margin, 14);
      curY = 22;
    }

    // Chapter Title
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin, curY, contentWidth, 12, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text(ch.title, margin + 4, curY + 8);
    curY += 18;

    // Chapter content
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    const paragraphs = ch.content.split('\n');
    for (const p of paragraphs) {
      if (!p.trim()) {
        curY += 3;
        continue;
      }

      const pLines = doc.splitTextToSize(p.trim(), contentWidth);
      if (curY + pLines.length * 5 > pageHeight - margin) {
        doc.addPage();
        curY = 22;
      }
      doc.text(pLines, margin, curY);
      curY += pLines.length * 5 + 3;
    }

    curY += 6;
  }

  // Footer on all pages
  const totalDocPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalDocPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Halaman ${i} dari ${totalDocPages} - Perpustakaan Digital MA Roudlotul Jadid`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}
