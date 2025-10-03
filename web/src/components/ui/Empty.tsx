export function Empty({ text = 'Sin datos para mostrar' }: { text?: string }) {
  return <div className="text-center text-sm text-gray-500 p-6">{text}</div>;
}
