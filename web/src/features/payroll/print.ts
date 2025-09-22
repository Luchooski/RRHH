// web/src/features/payroll/print.ts
// Exporta un nodo usando el motor de impresión del navegador (guardar como PDF).

type PrintOptions = {
  title?: string;
  forceLight?: boolean;   // fuerza tema claro solo en la ventana de impresión
  addBaseStyles?: boolean; // agrega estilos mínimos por si faltan reglas globales
};

/**
 * Abre una ventana con solo el nodo `el` y los estilos actuales,
 * dispara print() y cierra. El usuario elige "Guardar como PDF".
 */
export async function exportTemplatePrint(el: HTMLElement, opts: PrintOptions = {}) {
  if (!el) throw new Error('exportTemplatePrint: elemento inválido');

  const {
    title = 'Recibo',
    forceLight = true,
    addBaseStyles = true,
  } = opts;

  // 1) Capturamos los estilos existentes del documento actual (Vite/Tailwind)
  const styleTags = Array.from(
    document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"], style')
  );

  const stylesHTML = styleTags.map(tag => tag.outerHTML).join('\n');

  // 2) Clonamos el HTML del recibo
  // Nota: outerHTML incluye todas las clases/estilos utilitarios de Tailwind.
  const receiptHTML = el.outerHTML;

  // 3) CSS extra para asegurar contraste/fondo y buen layout en impresión
  const extraCSS = `
    @page { margin: 12mm; }
    html, body { height: auto; }
    body {
      ${forceLight ? 'background: #fff; color: #000;' : ''}
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Evitar cortes bruscos */
    #print-root { page-break-inside: avoid; }
    /* Asegurar que los elementos con overflow no oculten contenido */
    * { overflow: visible !important; }
  `;

  // 4) HTML de la ventana de impresión
  const htmlDoc = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  ${stylesHTML}
  ${addBaseStyles ? `<style>${extraCSS}</style>` : ''}
</head>
<body class="${forceLight ? 'bg-white text-black' : ''}">
  <div id="print-root">${receiptHTML}</div>
  <script>
    // Esperamos un tick para que apliquen estilos y fuentes
    (function () {
      function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
      ready(function(){
        setTimeout(function(){
          try { window.focus(); } catch(e){}
          window.print();
          setTimeout(function(){ try { window.close(); } catch(e){} }, 400);
        }, 200);
      });
    })();
  </script>
</body>
</html>`;

  // 5) Abrimos ventana, escribimos y listo
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
  if (!win) throw new Error('No se pudo abrir la ventana de impresión (popup bloqueado).');

  win.document.open();
  win.document.write(htmlDoc);
  win.document.close();
}

// util simple para evitar inyectar caracteres raros en <title>
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
