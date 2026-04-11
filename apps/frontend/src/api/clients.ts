import "./client";
import {
  listClientsClientsGet,
  createClientClientsPost,
  getClientClientsClientIdGet,
  updateClientClientsClientIdPatch,
  deleteClientClientsClientIdDelete,
} from "./generated/sdk.gen";
import type { ClientOut, CreateClientBody, UpdateClientBody } from "./generated/types.gen";

export type { ClientOut };

export async function listClients(): Promise<ClientOut[]> {
  const { data, error } = await listClientsClientsGet({ throwOnError: false });
  if (error) throw error;
  return data!;
}

export async function createClient(body: CreateClientBody): Promise<ClientOut> {
  const { data, error } = await createClientClientsPost({ body, throwOnError: false });
  if (error) throw error;
  return data!;
}

export async function getClient(clientId: string): Promise<ClientOut> {
  const { data, error } = await getClientClientsClientIdGet({
    path: { client_id: clientId },
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function updateClient(clientId: string, body: UpdateClientBody): Promise<ClientOut> {
  const { data, error } = await updateClientClientsClientIdPatch({
    path: { client_id: clientId },
    body,
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function deleteClient(clientId: string): Promise<void> {
  await deleteClientClientsClientIdDelete({
    path: { client_id: clientId },
    throwOnError: false,
  });
}
