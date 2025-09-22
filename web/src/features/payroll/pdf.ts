// web/src/features/payroll/pdf.ts
// Exporta el recibo a PDF (multipágina) asegurando que COLOR y TIPOGRAFÍA queden inlinéados.
// Importante: usamos foreignObjectRendering:true, por lo que el browser puede renderizar oklch/oklab.

export type PdfOptions = {
  filename?: string;
  marginMm?: number;
  pageFormat?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  scale?: number;
};

const MM_PER_INCH = 25.4;
const CSS_DPI = 96;
const pxToMm = (px: number) => (px * MM_PER_INCH) / CSS_DPI;
const mmToPx = (mm: number) => (mm * CSS_DPI) / MM_PER_INCH;

const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
const dlog = (...a: any[]) => { if (isDev) console.debug('[pdf]', ...a); };

// --- Props a inlinéar (colores + tipografía + algunas de layout que afectan texto) ---
const COLOR_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
] as const;

const TEXT_PROPS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'fontVariant',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'textDecoration',
  'textDecorationColor',
  'textUnderlineOffset',
  'textUnderlinePosition',
  'whiteSpace',
] as const;

// Para SVG embebido (si lo hubiera)
const SVG_COLOR_ATTRS = ['fill', 'stroke'] as const;

type RevertEntry = { el: Element; prop?: string; prevInline?: string | null; attr?: string; prevAttr?: string | null };

function kebab(prop: string) {
  return prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

/**
 * Inlinéa estilos COMPUTADOS (no solo rgb) para colores, tipografía y atributos SVG.
 * No filtramos oklch/oklab: los seteamos tal cual y foreignObject los renderiza bien.
 * Devuelve una función para revertir todos los cambios.
 */
function inlineComputedStyles(root: HTMLElement): () => void {
  const reverts: RevertEntry[] = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.currentNode as HTMLElement | null;

  while (node) {
    const el = node as HTMLElement;
    const cs = getComputedStyle(el);

    // Colores + Tipografía a estilo inline
    [...COLOR_PROPS, ...TEXT_PROPS].forEach((p) => {
      try {
        const v = (cs as any)[p] as string | undefined;
        if (v == null || v === '') return;
        const propName = kebab(p);
        const prev = el.style.getPropertyValue(propName);
        reverts.push({ el, prop: propName, prevInline: prev || null });
        el.style.setProperty(propName, v);
      } catch { /* noop */ }
    });

    // Atributos SVG (fill/stroke)
    if (el instanceof SVGElement) {
      const scs = getComputedStyle(el);
      SVG_COLOR_ATTRS.forEach((attr) => {
        try {
          const v = (scs as any)[attr] as string | undefined;
          if (!v) return;
          const prev = el.getAttribute(attr);
          reverts.push({ el, attr, prevAttr: prev ?? null });
          el.setAttribute(attr, v);
        } catch { /* noop */ }
      });
    }

    node = walker.nextNode() as HTMLElement | null;
  }

  // Revertir
  return () => {
    for (const r of reverts) {
      if (r.prop) {
        if (r.prevInline == null) (r.el as HTMLElement).style.removeProperty(r.prop);
        else (r.el as HTMLElement).style.setProperty(r.prop, r.prevInline);
      } else if (r.attr) {
        if (r.prevAttr == null) (r.el as Element).removeAttribute(r.attr);
        else (r.el as Element).setAttribute(r.attr, r.prevAttr);
      }
    }
  };
}

export function fitIntoBox(
  srcW: number,
  srcH: number,
  boxW: number,
  boxH: number
) {
  const s = Math.min(boxW / srcW, boxH / srcH, 1);
  return { w: Math.floor(srcW * s), h: Math.floor(srcH * s), scale: s };
}

async function renderNodeToCanvas(el: HTMLElement, scale = 2): Promise<HTMLCanvasElement> {
  const html2canvasMod = await import('html2canvas');
  const html2canvas: any = (html2canvasMod as any).default ?? html2canvasMod;

  try {
    const fonts = (document as any).fonts;
    if (fonts?.ready) await fonts.ready;
  } catch { /* ignore */ }

  // dos RAF para asegurar layout final
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // Fondo: respetamos el del elemento o del body; si ninguno, null (transparente)
  const elBg = getComputedStyle(el).backgroundColor;
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const isTransparent = (c: string | null | undefined) =>
    !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)';
  const bgForCanvas = !isTransparent(elBg) ? elBg : !isTransparent(bodyBg) ? bodyBg : null;

  // *** Paso clave: inlinéar estilos computados (incluye oklch/oklab) ***
  const revert = inlineComputedStyles(el);

  try {
    const opts: any = {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: bgForCanvas,
      logging: false,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
      foreignObjectRendering: true, // importante para que el browser pinte oklch/oklab
    };

    const canvas: HTMLCanvasElement = await html2canvas(el, opts);
    if (!canvas || !canvas.width || !canvas.height) {
      throw new Error('Canvas vacío (posible elemento no visible o CORS).');
    }
    return canvas;
  } finally {
    // siempre revertimos para no afectar la UI
    revert();
  }
}

function sliceCanvas(source: HTMLCanvasElement, y: number, h: number): HTMLCanvasElement {
  const slice = document.createElement('canvas');
  slice.width = source.width;
  slice.height = Math.min(h, source.height - y);
  const ctx = slice.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear contexto 2D del canvas.');
  ctx.drawImage(source, 0, y, source.width, slice.height, 0, 0, slice.width, slice.height);
  return slice;
}

export async function exportTemplatePdf(
  el: HTMLElement,
  opts: PdfOptions = {}
): Promise<void> {
  if (!el) throw new Error('exportTemplatePdf: elemento inválido');

  const {
    filename = 'recibo.pdf',
    marginMm = 10,
    pageFormat = 'a4',
    orientation = 'portrait',
    scale = 2,
  } = opts;

  dlog('export:start', { filename, marginMm, pageFormat, orientation });

  // 1) Canvas del nodo
  const canvas = await renderNodeToCanvas(el, scale);

  // 2) jsPDF compatible
  const jspdfMod: any = await import('jspdf');
  const JsPDFCtor: any = jspdfMod.jsPDF ?? jspdfMod.default;
  if (!JsPDFCtor) throw new Error('No se pudo cargar jsPDF');

  const pdf = new JsPDFCtor({ unit: 'mm', format: pageFormat, orientation });

  const pageW: number = pdf.internal.pageSize.getWidth();
  const pageH: number = pdf.internal.pageSize.getHeight();
  const innerW = pageW - marginMm * 2;
  const innerH = pageH - marginMm * 2;

  const imgWmm = pxToMm(canvas.width);
  const imgHmm = pxToMm(canvas.height);

  const fit = fitIntoBox(imgWmm, imgHmm, innerW, innerH);
  const imgDataFull = canvas.toDataURL('image/png');

  if (fit.h <= innerH && fit.w <= innerW) {
    pdf.addImage(imgDataFull, 'PNG', marginMm, marginMm, fit.w, fit.h, undefined, 'FAST');
    pdf.save(filename);
    dlog('export:done (single)');
    return;
  }

  // multipágina
  const drawScale = innerW / imgWmm;
  const sliceHeightPx = Math.max(1, Math.floor(mmToPx(innerH / drawScale)));

  let y = 0;
  let first = true;
  while (y < canvas.height) {
    const part = sliceCanvas(canvas, y, sliceHeightPx);
    const partData = part.toDataURL('image/png');

    if (!first) pdf.addPage({ format: pageFormat, orientation });
    pdf.addImage(partData, 'PNG', marginMm, marginMm, innerW, innerH, undefined, 'FAST');

    y += sliceHeightPx;
    first = false;
  }

  pdf.save(filename);
  dlog('export:done (multi)');
}

export async function withVisibleForCapture<T>(
  el: HTMLElement,
  doWork: () => Promise<T> | T,
  opts: { lightBg?: string; textColor?: string } = { lightBg: '#ffffff', textColor: '#000' }
): Promise<T> {
  const prev = {
    position: el.style.position,
    left: el.style.left,
    top: el.style.top,
    visibility: el.style.visibility,
    opacity: el.style.opacity,
    transform: el.style.transform,
    filter: el.style.filter,
    backgroundColor: el.style.backgroundColor,
    color: el.style.color,
  };

  // lo movemos fuera de pantalla pero visible y con contraste
  el.style.position = 'absolute';
  el.style.left = '-99999px';
  el.style.top = '0';
  el.style.visibility = 'visible';
  el.style.opacity = '1';
  el.style.transform = 'none';
  el.style.filter = 'none';
  if (opts.lightBg) el.style.backgroundColor = opts.lightBg;
  if (opts.textColor) el.style.color = opts.textColor;

  // dos RAF para relayout
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    return await doWork();
  } finally {
    el.style.position = prev.position;
    el.style.left = prev.left;
    el.style.top = prev.top;
    el.style.visibility = prev.visibility;
    el.style.opacity = prev.opacity;
    el.style.transform = prev.transform;
    el.style.filter = prev.filter;
    el.style.backgroundColor = prev.backgroundColor;
    el.style.color = prev.color;
  }
}