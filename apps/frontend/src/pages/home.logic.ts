export function getClientInitials(clientName: string): string {
  return clientName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("");
}
