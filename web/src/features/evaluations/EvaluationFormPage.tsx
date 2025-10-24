import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toolbar } from '@/components/ui/Toolbar';
import { useToast } from '@/components/ui/Toast';
import { Textarea } from '@/components/ui/Textarea';
import { Save, Send, AlertCircle, Star } from 'lucide-react';
import * as api from './api';
import type { EvaluationInstance, EvaluationTemplate, CompetencyRating, ObjectiveRating, GeneralAnswer } from './dto';

interface EvaluationFormPageProps {
  evaluationId: string;
}

export default function EvaluationFormPage({ evaluationId }: EvaluationFormPageProps) {
  const { push } = useToast();
  const queryClient = useQueryClient();

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ['evaluation', evaluationId],
    queryFn: () => api.getEvaluation(evaluationId),
  });

  const { data: template } = useQuery({
    queryKey: ['evaluation-template', evaluation?.templateId],
    queryFn: () => api.getTemplate(evaluation!.templateId),
    enabled: !!evaluation?.templateId,
  });

  const [competencyRatings, setCompetencyRatings] = useState<CompetencyRating[]>([]);
  const [objectiveRatings, setObjectiveRatings] = useState<ObjectiveRating[]>([]);
  const [generalAnswers, setGeneralAnswers] = useState<GeneralAnswer[]>([]);
  const [overallComment, setOverallComment] = useState('');

  useEffect(() => {
    if (evaluation) {
      setCompetencyRatings(evaluation.competencyRatings || []);
      setObjectiveRatings(evaluation.objectiveRatings || []);
      setGeneralAnswers(evaluation.generalAnswers || []);
      setOverallComment(evaluation.overallComment || '');
    }
  }, [evaluation]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.updateEvaluation(evaluationId, data),
    onSuccess: () => {
      push({ kind: 'success', title: 'Guardado', message: 'Progreso guardado correctamente' });
      queryClient.invalidateQueries({ queryKey: ['evaluation', evaluationId] });
    },
    onError: (error: any) => {
      push({ kind: 'error', title: 'Error', message: error?.message || 'No se pudo guardar' });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => api.submitEvaluation(evaluationId),
    onSuccess: () => {
      push({ kind: 'success', title: 'Enviado', message: 'Evaluacion enviada correctamente' });
      queryClient.invalidateQueries({ queryKey: ['evaluation', evaluationId] });
    },
    onError: (error: any) => {
      push({ kind: 'error', title: 'Error', message: error?.message || 'No se pudo enviar' });
    },
  });

  const handleSave = async () => {
    await saveMutation.mutateAsync({
      competencyRatings,
      objectiveRatings,
      generalAnswers,
      overallComment,
    });
  };

  const handleSubmit = async () => {
    if (!template) return;

    const requiredCompetencies = template.competencies.filter((c) => c.required);
    const ratedCompetencies = competencyRatings.filter((r) => r.rating > 0);

    if (ratedCompetencies.length < requiredCompetencies.length) {
      push({
        kind: 'error',
        title: 'Error',
        message: 'Debe calificar todas las competencias requeridas',
      });
      return;
    }

    const requiredObjectives = template.objectives.filter((o) => o.required);
    const ratedObjectives = objectiveRatings.filter((r) => r.rating > 0);

    if (ratedObjectives.length < requiredObjectives.length) {
      push({
        kind: 'error',
        title: 'Error',
        message: 'Debe calificar todos los objetivos requeridos',
      });
      return;
    }

    if (!confirm('Esta seguro de enviar esta evaluacion? No podra modificarla despues.')) return;

    await saveMutation.mutateAsync({
      competencyRatings,
      objectiveRatings,
      generalAnswers,
      overallComment,
    });
    await submitMutation.mutateAsync();
  };

  const updateCompetencyRating = (competencyId: string, rating: number, comment?: string) => {
    setCompetencyRatings((prev) => {
      const existing = prev.find((r) => r.competencyId === competencyId);
      if (existing) {
        return prev.map((r) =>
          r.competencyId === competencyId ? { ...r, rating, comment: comment || r.comment } : r
        );
      }
      return [...prev, { competencyId, rating, comment: comment || '' }];
    });
  };

  const updateObjectiveRating = (objectiveId: string, rating: number, achievement?: string, comment?: string) => {
    setObjectiveRatings((prev) => {
      const existing = prev.find((r) => r.objectiveId === objectiveId);
      if (existing) {
        return prev.map((r) =>
          r.objectiveId === objectiveId ? { ...r, rating, achievement: achievement || r.achievement, comment: comment || r.comment } : r
        );
      }
      return [...prev, { objectiveId, rating, achievement: achievement || '', comment: comment || '' }];
    });
  };

  const updateGeneralAnswer = (questionId: string, answer: string) => {
    setGeneralAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        return prev.map((a) => (a.questionId === questionId ? { ...a, answer } : a));
      }
      return [...prev, { questionId, answer }];
    });
  };

  const getRatingForCompetency = (competencyId: string) => {
    return competencyRatings.find((r) => r.competencyId === competencyId);
  };

  const getRatingForObjective = (objectiveId: string) => {
    return objectiveRatings.find((r) => r.objectiveId === objectiveId);
  };

  const getAnswerForQuestion = (questionId: string) => {
    return generalAnswers.find((a) => a.questionId === questionId)?.answer || '';
  };

  const renderRatingScale = (value: number, max: number, onChange: (val: number) => void) => {
    return (
      <div className="flex gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((val) => (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={'w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold transition-all ' + (value === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400')}
          >
            {val}
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center py-8">Cargando evaluacion...</div>
      </div>
    );
  }

  if (!evaluation || !template) {
    return (
      <div className="container">
        <Card>
          <CardBody>
            <div className="text-center py-8 text-red-600">No se encontro la evaluacion</div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const isReadOnly = evaluation.status !== 'pending' && evaluation.status !== 'in-progress';

  return (
    <div className="container space-y-4 pb-8">
      <Toolbar
        title="Evaluacion de Desempeno"
        right={
          !isReadOnly && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                <Save size={16} className="mr-2" />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar Progreso'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
              >
                <Send size={16} className="mr-2" />
                {submitMutation.isPending ? 'Enviando...' : 'Enviar Evaluacion'}
              </Button>
            </div>
          )
        }
      />

      <Card>
        <CardBody>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">Evaluado</div>
              <div className="font-semibold">{evaluation.evaluatedEmployeeName}</div>
              {evaluation.evaluatedEmployeePosition && (
                <div className="text-sm text-gray-600">{evaluation.evaluatedEmployeePosition}</div>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-500">Tipo de Evaluacion</div>
              <div className="font-semibold capitalize">{evaluation.evaluatorRole}</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {isReadOnly && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardBody>
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle size={20} />
              <span className="font-medium">Esta evaluacion ya fue enviada y no se puede modificar.</span>
            </div>
          </CardBody>
        </Card>
      )}

      {template.competencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Competencias</CardTitle>
          </CardHeader>
          <CardBody className="space-y-6">
            {template.competencies.map((competency) => {
              const rating = getRatingForCompetency(competency.id);
              return (
                <div key={competency.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{competency.name}</h4>
                        {competency.required && (
                          <span className="text-xs text-red-600">*</span>
                        )}
                      </div>
                      {competency.description && (
                        <p className="text-sm text-gray-600 mt-1">{competency.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Calificacion</label>
                      {renderRatingScale(
                        rating?.rating || 0,
                        template.ratingScale.max,
                        (val) => updateCompetencyRating(competency.id, val)
                      )}
                      {rating?.rating && rating.rating > 0 && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span>{rating.rating} / {template.ratingScale.max}</span>
                        </div>
                      )}
                    </div>

                    {template.config.allowComments && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Comentarios</label>
                        <Textarea
                          value={rating?.comment || ''}
                          onChange={(e) => updateCompetencyRating(competency.id, rating?.rating || 0, e.target.value)}
                          placeholder="Agregue comentarios sobre esta competencia..."
                          rows={2}
                          disabled={isReadOnly}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      {template.objectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Objetivos</CardTitle>
          </CardHeader>
          <CardBody className="space-y-6">
            {template.objectives.map((objective) => {
              const rating = getRatingForObjective(objective.id);
              return (
                <div key={objective.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{objective.title}</h4>
                        {objective.required && (
                          <span className="text-xs text-red-600">*</span>
                        )}
                      </div>
                      {objective.description && (
                        <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Calificacion</label>
                      {renderRatingScale(
                        rating?.rating || 0,
                        template.ratingScale.max,
                        (val) => updateObjectiveRating(objective.id, val)
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Logro</label>
                      <Textarea
                        value={rating?.achievement || ''}
                        onChange={(e) => updateObjectiveRating(objective.id, rating?.rating || 0, e.target.value)}
                        placeholder="Describa el logro de este objetivo..."
                        rows={2}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Comentarios Generales</CardTitle>
        </CardHeader>
        <CardBody>
          <Textarea
            value={overallComment}
            onChange={(e) => setOverallComment(e.target.value)}
            placeholder="Comentarios generales sobre el desempeno..."
            rows={4}
            disabled={isReadOnly}
          />
        </CardBody>
      </Card>
    </div>
  );
}
