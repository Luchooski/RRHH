export default function SkipLink() {
  return (
    <a
      href="#main"
      className="
        sr-only
        focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[1000]
        focus:rounded-lg focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-white
        dark:focus:bg-zinc-100 dark:focus:text-zinc-900
      "
    >
      Saltar al contenido
    </a>
  );
}
