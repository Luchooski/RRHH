// util para exportar el componente de recibo a PDF
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type PdfOptions = {
  filename: string;
  marginMm?: number; // margen exterior en mm (A4)
  scale?: number;    // escala inicial para html2canvas
};

/**
 * Convierte un elemento DOM (recibo) en PDF A4, ajustando la escala para que entre sin cortar.
 * - Usa html2canvas -> PNG
 * - Inserta en un PDF A4 (vertical)
 */
export async function exportTemplatePdf(el: HTMLElement, opts: PdfOptions) {
  const {
    filename,
    marginMm = 10,
    scale = 2
  } = opts;

  // A4 en jsPDF: 210 x 297 mm
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // márgenes internos
  const maxW = pageW - marginMm * 2;
  const maxH = pageH - marginMm * 2;

  // Render a canvas
  const canvas = await html2canvas(el, {
    scale,
    backgroundColor: null, // respeta fondo (dark/light) del nodo
    useCORS: true
  });
  const imgData = canvas.toDataURL('image/png');

  // dimensiones de la imagen resultante (px) -> convertiremos proporcionalmente a mm
  const imgPxW = canvas.width;
  const imgPxH = canvas.height;

  // densidad: 96 px = 25.4 mm (estándar CSS)
  const px2mm = 25.4 / 96;
  let imgMmW = imgPxW * px2mm;
  let imgMmH = imgPxH * px2mm;

  // si excede la página, escalar
  const scaleFactor = Math.min(maxW / imgMmW, maxH / imgMmH, 1);
  imgMmW = imgMmW * scaleFactor;
  imgMmH = imgMmH * scaleFactor;

  const x = (pageW - imgMmW) / 2;
  const y = (pageH - imgMmH) / 2;

  pdf.addImage(imgData, 'PNG', x, y, imgMmW, imgMmH, undefined, 'FAST');
  pdf.save(filename);
}

/** Pequeña función auxiliar para testear la escala */
export function fitIntoBox(
  contentWmm: number,
  contentHmm: number,
  boxWmm: number,
  boxHmm: number
) {
  const s = Math.min(boxWmm / contentWmm, boxHmm / contentHmm, 1);
  return { w: contentWmm * s, h: contentHmm * s, scale: s };
}
