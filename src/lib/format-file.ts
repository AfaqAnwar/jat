export function formatFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function deduplicateName(name: string, existing: string[]): string {
  if (!existing.includes(name)) return name;
  let version = 2;
  while (existing.includes(`${name} V${version}`)) version++;
  return `${name} V${version}`;
}
