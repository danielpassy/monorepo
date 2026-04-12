import "./client";
import {
  listCustomersCustomersGet,
  createCustomerCustomersPost,
  getCustomerCustomersCustomerIdGet,
  updateCustomerCustomersCustomerIdPatch,
  deleteCustomerCustomersCustomerIdDelete,
} from "./generated/sdk.gen";
import type { CustomerOut, CreateCustomerBody, UpdateCustomerBody } from "./generated/types.gen";

export type { CustomerOut };

export async function listCustomers(): Promise<CustomerOut[]> {
  const { data, error } = await listCustomersCustomersGet({ throwOnError: false });
  if (error) throw error;
  return data!;
}

export async function createCustomer(body: CreateCustomerBody): Promise<CustomerOut> {
  const { data, error } = await createCustomerCustomersPost({ body, throwOnError: false });
  if (error) throw error;
  return data!;
}

export async function getCustomer(customerId: string): Promise<CustomerOut> {
  const { data, error } = await getCustomerCustomersCustomerIdGet({
    path: { customer_id: customerId },
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function updateCustomer(
  customerId: string,
  body: UpdateCustomerBody,
): Promise<CustomerOut> {
  const { data, error } = await updateCustomerCustomersCustomerIdPatch({
    path: { customer_id: customerId },
    body,
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function deleteCustomer(customerId: string): Promise<void> {
  await deleteCustomerCustomersCustomerIdDelete({
    path: { customer_id: customerId },
    throwOnError: false,
  });
}
