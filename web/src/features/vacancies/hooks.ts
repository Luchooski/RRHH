import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Vacancy, VacancyCreateInput, ApplicationCreateInput } from './dto';
import { apiCreateApplication, apiCreateVacancy, apiListVacancies } from './api';

export function useListVacancies() {
  return useQuery<Vacancy[]>({
    queryKey: ['vacancies'],
    queryFn: apiListVacancies,
    staleTime: 10_000,
  });
}

export function useCreateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VacancyCreateInput) => apiCreateVacancy(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacancies'] }),
  });
}

export function useCreateApplication() {
  return useMutation({ mutationFn: (input: ApplicationCreateInput) => apiCreateApplication(input) });
}
