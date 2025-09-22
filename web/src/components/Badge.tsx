type Props = { tone?: 'neutral'|'success'|'warning'|'danger'|'info'; children: React.ReactNode };
export default function Badge({ tone='neutral', children }: Props) {
  const map = {
    neutral: 'bg-black/5 text-black/80 dark:bg-white/10 dark:text-white',
    success: 'bg-green-500/15 text-green-700 dark:text-green-300',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    danger:  'bg-red-500/15 text-red-700 dark:text-red-300',
    info:    'bg-blue-500/15 text-blue-700 dark:text-blue-300'
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[tone]}`}>{children}</span>;
}
