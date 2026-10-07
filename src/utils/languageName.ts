export function getLanguageName(code: string, languages: Record<string, string>): string | undefined {
  return languages[code];
}
