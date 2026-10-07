import { getLanguageName } from "./languageName";

describe("getLanguageName", () => {
  const languages = { en: "English", pl: "Polish" };

  it("returns a label for a supported language code", () => {
    expect(getLanguageName("en", languages)).toBe("English");
  });

  it("returns undefined for an unsupported code or language name", () => {
    expect(getLanguageName("English", languages)).toBeUndefined();
  });
});
