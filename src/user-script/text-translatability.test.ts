import { hasTranslatableText } from "./text-translatability";

describe("hasTranslatableText", () => {
  it("returns false for null text content", () => {
    expect(hasTranslatableText(null, /\p{L}/u)).toBe(false);
  });

  it("returns true for text containing a letter", () => {
    expect(hasTranslatableText("hello", /\p{L}/u)).toBe(true);
  });
});
