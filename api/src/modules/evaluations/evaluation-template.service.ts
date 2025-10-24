import { EvaluationTemplate, IEvaluationTemplate } from './evaluation-template.model.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create evaluation template
 */
export async function createTemplate(params: {
  tenantId: string;
  userId: string;
  userName: string;
  data: Partial<IEvaluationTemplate>;
}) {
  const { tenantId, userId, userName, data } = params;

  // Generate IDs for competencies, objectives, and questions if not provided
  if (data.competencies) {
    data.competencies = data.competencies.map((comp) => ({
      ...comp,
      id: comp.id || uuidv4(),
    }));
  }

  if (data.objectives) {
    data.objectives = data.objectives.map((obj) => ({
      ...obj,
      id: obj.id || uuidv4(),
    }));
  }

  if (data.generalQuestions) {
    data.generalQuestions = data.generalQuestions.map((q) => ({
      ...q,
      id: q.id || uuidv4(),
    }));
  }

  const template = new EvaluationTemplate({
    ...data,
    tenantId,
    createdBy: userId,
    createdByName: userName,
  });

  await template.save();
  return template;
}

/**
 * List templates
 */
export async function listTemplates(params: {
  tenantId: string;
  type?: string;
  isActive?: boolean;
}) {
  const { tenantId, type, isActive } = params;

  const query: any = { tenantId };
  if (type) query.type = type;
  if (isActive !== undefined) query.isActive = isActive;

  const templates = await EvaluationTemplate.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return templates;
}

/**
 * Get template by ID
 */
export async function getTemplateById(params: {
  tenantId: string;
  templateId: string;
}): Promise<any> {
  const { tenantId, templateId } = params;

  const template = await EvaluationTemplate.findOne({
    _id: templateId,
    tenantId,
  }).lean();

  if (!template) {
    throw new Error('Template not found');
  }

  return template;
}

/**
 * Update template
 */
export async function updateTemplate(params: {
  tenantId: string;
  templateId: string;
  updates: Partial<IEvaluationTemplate>;
}) {
  const { tenantId, templateId, updates } = params;

  // Generate IDs for new items if needed
  if (updates.competencies) {
    updates.competencies = updates.competencies.map((comp) => ({
      ...comp,
      id: comp.id || uuidv4(),
    }));
  }

  if (updates.objectives) {
    updates.objectives = updates.objectives.map((obj) => ({
      ...obj,
      id: obj.id || uuidv4(),
    }));
  }

  if (updates.generalQuestions) {
    updates.generalQuestions = updates.generalQuestions.map((q) => ({
      ...q,
      id: q.id || uuidv4(),
    }));
  }

  const template = await EvaluationTemplate.findOneAndUpdate(
    { _id: templateId, tenantId },
    { $set: updates },
    { new: true }
  );

  if (!template) {
    throw new Error('Template not found');
  }

  return template;
}

/**
 * Delete template
 */
export async function deleteTemplate(params: {
  tenantId: string;
  templateId: string;
}) {
  const { tenantId, templateId } = params;

  const result = await EvaluationTemplate.deleteOne({
    _id: templateId,
    tenantId,
  });

  if (result.deletedCount === 0) {
    throw new Error('Template not found');
  }

  return { success: true };
}

/**
 * Toggle template active status
 */
export async function toggleTemplateStatus(params: {
  tenantId: string;
  templateId: string;
}) {
  const { tenantId, templateId } = params;

  const template = await EvaluationTemplate.findOne({
    _id: templateId,
    tenantId,
  });

  if (!template) {
    throw new Error('Template not found');
  }

  (template as any).isActive = !(template as any).isActive;
  await template.save();

  return template;
}

/**
 * Get default competencies by category
 */
export function getDefaultCompetencies() {
  return {
    technical: [
      {
        id: uuidv4(),
        name: 'Conocimiento Técnico',
        description: 'Dominio de herramientas y tecnologías requeridas para el puesto',
        category: 'Técnica',
        weight: 20,
        required: true,
      },
      {
        id: uuidv4(),
        name: 'Calidad del Trabajo',
        description: 'Precisión, exactitud y atención al detalle en las tareas',
        category: 'Técnica',
        weight: 15,
        required: true,
      },
      {
        id: uuidv4(),
        name: 'Productividad',
        description: 'Capacidad de completar tareas dentro de los plazos establecidos',
        category: 'Técnica',
        weight: 15,
        required: true,
      },
    ],
    soft: [
      {
        id: uuidv4(),
        name: 'Trabajo en Equipo',
        description: 'Colaboración efectiva con colegas y contribución al equipo',
        category: 'Blanda',
        weight: 15,
        required: true,
      },
      {
        id: uuidv4(),
        name: 'Comunicación',
        description: 'Claridad y efectividad en la comunicación oral y escrita',
        category: 'Blanda',
        weight: 10,
        required: true,
      },
      {
        id: uuidv4(),
        name: 'Adaptabilidad',
        description: 'Flexibilidad ante cambios y nuevos desafíos',
        category: 'Blanda',
        weight: 10,
        required: true,
      },
    ],
    leadership: [
      {
        id: uuidv4(),
        name: 'Liderazgo',
        description: 'Capacidad de guiar, motivar e inspirar al equipo',
        category: 'Liderazgo',
        weight: 15,
        required: false,
      },
      {
        id: uuidv4(),
        name: 'Toma de Decisiones',
        description: 'Capacidad de tomar decisiones informadas y oportunas',
        category: 'Liderazgo',
        weight: 10,
        required: false,
      },
      {
        id: uuidv4(),
        name: 'Desarrollo del Equipo',
        description: 'Inversión en el crecimiento y desarrollo de los miembros del equipo',
        category: 'Liderazgo',
        weight: 10,
        required: false,
      },
    ],
  };
}

/**
 * Get default rating scales
 */
export function getDefaultRatingScales() {
  return {
    scale1to5: {
      min: 1,
      max: 5,
      scales: [
        { value: 1, label: 'Insatisfactorio', description: 'No cumple con las expectativas', color: '#ef4444' },
        { value: 2, label: 'Necesita Mejorar', description: 'Cumple parcialmente las expectativas', color: '#f59e0b' },
        { value: 3, label: 'Cumple Expectativas', description: 'Desempeño esperado para el puesto', color: '#84cc16' },
        { value: 4, label: 'Supera Expectativas', description: 'Desempeño superior al esperado', color: '#22c55e' },
        { value: 5, label: 'Excepcional', description: 'Desempeño sobresaliente', color: '#10b981' },
      ],
    },
    scale1to10: {
      min: 1,
      max: 10,
      scales: [
        { value: 1, label: '1 - Muy Bajo', description: '', color: '#dc2626' },
        { value: 2, label: '2 - Bajo', description: '', color: '#ea580c' },
        { value: 3, label: '3', description: '', color: '#f59e0b' },
        { value: 4, label: '4', description: '', color: '#facc15' },
        { value: 5, label: '5 - Medio', description: '', color: '#84cc16' },
        { value: 6, label: '6', description: '', color: '#65a30d' },
        { value: 7, label: '7 - Bueno', description: '', color: '#22c55e' },
        { value: 8, label: '8', description: '', color: '#16a34a' },
        { value: 9, label: '9 - Muy Bueno', description: '', color: '#15803d' },
        { value: 10, label: '10 - Excelente', description: '', color: '#14532d' },
      ],
    },
  };
}
