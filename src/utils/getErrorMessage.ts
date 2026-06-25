export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  const str = String(error);
  return str || fallback;
}
