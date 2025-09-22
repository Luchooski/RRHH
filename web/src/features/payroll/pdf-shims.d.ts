// shims para compatibilidad de tipos entre versiones

declare module 'html2canvas' {
  const mod: any; // forzamos any para permitir 'scale' y otras props
  export default mod;
}

declare module 'jspdf' {
  // algunas versiones exponen default, otras { jsPDF }
  export const jsPDF: any;
  const _default: any;
  export default _default;
}
