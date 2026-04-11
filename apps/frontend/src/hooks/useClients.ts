import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listClients, createClient, getClient, deleteClient } from "@/api/clients";
import type { CreateClientBody } from "@/api/generated/types.gen";

export const CLIENTS_QUERY_KEY = ["clients"] as const;
export const clientQueryKey = (clientId: string) => ["clients", clientId] as const;

export function useClients() {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: listClients,
  });
}

export function useClient(clientId: string) {
  return useQuery({
    queryKey: clientQueryKey(clientId),
    queryFn: () => getClient(clientId),
    enabled: !!clientId,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateClientBody) => createClient(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => deleteClient(clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}
