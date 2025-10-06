import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { listByVacancy, updateStatus } from './api';
import type { Stage } from './dto';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

const STAGES: Stage[] = ['sent','interview','feedback','offer','hired','rejected'];
const LABELS: Record<Stage,string> = {
  sent:'Aplicado', interview:'Entrevista', feedback:'Feedback', offer:'Oferta',
  hired:'Contratado', rejected:'Rechazado'
};

function Card({ id, name }: { id: string; name: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="card p-3 cursor-grab">
      <div className="font-medium">{name}</div>
    </div>
  );
}

export default function VacancyPipelinePage() {
  const { id = '' } = useParams();
  const [cols, setCols] = useState<Record<Stage, { id:string; name:string }[]>>({
    sent:[], interview:[], feedback:[], offer:[], hired:[], rejected:[]
  });
  const toast = useToast();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 }}));

  useEffect(() => {
    listByVacancy(id).then(items => {
      const next: any = { sent:[], interview:[], feedback:[], offer:[], hired:[], rejected:[] };
      for (const a of items) next[a.status]?.push({ id: a.id, name: a.candidateName ?? a.candidateId });
      setCols(next);
    });
  }, [id]);

  const onDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;
    const fromStage = (Object.keys(cols) as Stage[]).find(k => cols[k].some(c => c.id === active.id))!;
    const toStage = (over.id as Stage) || fromStage;
    if (fromStage === toStage) return;

    const card = cols[fromStage].find(c => c.id === active.id)!;
    setCols(prev => {
      const source = prev[fromStage].filter(c => c.id !== card.id);
      const target = [...prev[toStage], card];
      return { ...prev, [fromStage]: source, [toStage]: target };
    });
    try {
      await updateStatus(card.id, toStage);
      toast.success('Estado actualizado');
    } catch {
      toast.error('No se pudo actualizar');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pipeline de vacante</h1>
        <Link className="btn" to="/vacantes">Volver</Link>
      </header>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {STAGES.map(stage => (
            <div key={stage} className="rounded-xl border bg-[--color-card] p-3">
              <div className="text-sm font-semibold mb-2">{LABELS[stage]}</div>
              <SortableContext items={cols[stage].map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div id={stage} className="space-y-2 min-h-10">
                  {cols[stage].map(c => <Card key={c.id} id={c.id} name={c.name} />)}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
