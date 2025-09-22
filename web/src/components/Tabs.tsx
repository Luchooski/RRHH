export function Tabs({tabs, current, onChange}:{tabs:string[]; current:string; onChange:(t:string)=>void}) {
  return (
    <div role="tablist" className="flex gap-2 border-b border-[--color-border] dark:border-zinc-700">
      {tabs.map(t=>(
        <button key={t} role="tab" aria-selected={current===t}
          className={`h-10 px-3 ${current===t?'border-b-2 border-[--color-primary] font-medium':'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
          onClick={()=>onChange(t)}>{t}</button>
      ))}
    </div>
  );
}
