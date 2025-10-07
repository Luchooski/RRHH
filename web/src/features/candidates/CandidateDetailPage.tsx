import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteCandidate, getCandidate } from './api';
import { Send, Pencil, Trash2, ExternalLink } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import SendToVacancyModal from './SendToVacancyModal';
import { useState } from 'react';
import ScheduleInterviewModal from '@/features/interviews/ScheduleInterviewModal';

export default function CandidateDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [sendOpen, setSendOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const { data: c, isLoading, isError } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => getCandidate(id),
    enabled: !!id,
  });

  const mDel = useMutation({
    mutationFn: deleteCandidate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); nav('/candidatos'); },
  });

  if (isLoading) return <div className="p-6">Cargando…</div>;
  if (isError || !c) return <div className="p-6 text-red-600">No se pudo cargar.</div>;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-4">
        <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
              <p className="text-sm text-[--color-muted]">{c.email} · {c.location ?? '—'} · {(c.seniority ?? '').toUpperCase() || '—'}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={()=>setScheduleOpen(true)}>
                Programar entrevista
              </button>

              <button className="btn btn-primary" onClick={()=>setSendOpen(true)}>
                <Send className="size-4 mr-2" /> Enviar a vacante
              </button>
              <Link to={`/candidatos/${c.id}/editar`} className="btn"><Pencil className="size-4 mr-2" /> Editar</Link>
              <button className="btn" onClick={()=>mDel.mutate(c.id)}><Trash2 className="size-4 mr-2" /> Borrar</button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
            <h2 className="text-base font-semibold mb-2">Perfil</h2>
            <dl className="text-sm space-y-1">
              <div><dt className="text-zinc-500">Teléfono</dt><dd>{c.phone ?? '—'}</dd></div>
              <div><dt className="text-zinc-500">Pretensión</dt><dd>{c.salaryExpectation ? c.salaryExpectation : '—'}</dd></div>
              <div><dt className="text-zinc-500">Skills</dt><dd>{c.skills?.length ? c.skills.join(', ') : '—'}</dd></div>
              <div><dt className="text-zinc-500">Tags</dt><dd>{c.tags?.length ? c.tags.join(', ') : '—'}</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
            <h2 className="text-base font-semibold mb-2">Enlaces</h2>
            <ul className="text-sm space-y-1">
              {c.resumeUrl && (
                <li>
                  <a href={c.resumeUrl} target="_blank" rel="noreferrer" className="link"><ExternalLink className="inline size-4 mr-1" /> CV / Portfolio</a>
                </li>
              )}
              {c.links?.map((l, i) => (
                <li key={i}>
                  <a href={l.url} target="_blank" rel="noreferrer" className="link"><ExternalLink className="inline size-4 mr-1" /> {l.label || l.url}</a>
                </li>
              ))}
              {!c.resumeUrl && (!c.links || !c.links.length) && <li className="text-zinc-500">Sin enlaces</li>}
            </ul>
          </div>
          <div className="md:col-span-2 rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
            <h2 className="text-base font-semibold mb-2">Notas</h2>
            <p className="text-sm whitespace-pre-wrap">{c.notes || '—'}</p>
          </div>
          {/* Enviar a vacante */}
      <Modal open={sendOpen} onClose={()=>setSendOpen(false)}>
        <SendToVacancyModal candidateId={id} onClose={()=>setSendOpen(false)} />
      </Modal>

      {/* NUEVO: Programar entrevista */}
      <Modal open={scheduleOpen} onClose={()=>setScheduleOpen(false)}>
        <ScheduleInterviewModal candidateId={id} onClose={()=>setScheduleOpen(false)} />
      </Modal>
        </section>
      </div>

      <Modal open={sendOpen} onClose={()=>setSendOpen(false)}>
        <SendToVacancyModal candidateId={id} onClose={()=>setSendOpen(false)} />
      </Modal>
    </div>
  );
}
