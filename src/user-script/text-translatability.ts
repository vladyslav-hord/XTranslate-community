export function hasTranslatableText(text: string | null, letterPattern: RegExp): boolean {
  return Boolean(text && letterPattern.test(text));
}
