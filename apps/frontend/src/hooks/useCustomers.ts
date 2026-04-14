import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCustomers, createCustomer, getCustomer, deleteCustomer } from "@/api/customers";
import type { CreateCustomerInput } from "@/api/generated/types.gen";

export const CUSTOMERS_QUERY_KEY = ["customers"] as const;
export const customerQueryKey = (customerId: string) => ["customers", customerId] as const;

export function useCustomers() {
  return useQuery({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: listCustomers,
  });
}

export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: customerQueryKey(customerId),
    queryFn: () => getCustomer(customerId),
    enabled: !!customerId,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCustomerInput) => createCustomer(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });
}
