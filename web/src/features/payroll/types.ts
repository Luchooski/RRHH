// types.ts (opcional centralizar)
export type AppliedConcept = {
  id: string;
  name: string;
  type: 'remunerativo' | 'no_remunerativo' | 'deduccion';
  amount: number;
  details?: string;
};
