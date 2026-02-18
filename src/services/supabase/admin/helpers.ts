export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function isRecentlyActive(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false;
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return new Date(lastActiveAt).getTime() > fiveMinutesAgo;
}
