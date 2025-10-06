import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Client, ClientCreateInput, ClientQuery } from './dto';
import { apiCreateClient, apiListClients } from './api';

const key = (p?: Partial<ClientQuery>) => ['clients', p ?? {}];

export function useListClients(params: Partial<ClientQuery>) {
  return useQuery<Client[]>({
    queryKey: key(params),
    queryFn: () => apiListClients(params),
    staleTime: 10_000,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientCreateInput) => apiCreateClient(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
