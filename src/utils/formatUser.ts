export function formatUser(userCode?: string | null, fullName?: string | null): string {
  const name = fullName || 'Unknown User';
  if (userCode) {
    return `${userCode} — ${name}`;
  }
  return `Code not assigned — ${name}`;
}
