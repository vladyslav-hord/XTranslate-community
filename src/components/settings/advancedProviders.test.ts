import { ProviderCodeName } from "../../providers/providers";
import { getConfiguredAdvancedProviders } from "./advancedProviders";

const provider = (name: ProviderCodeName, available: boolean) => ({
  name,
  isAvailable: () => available,
});

describe("getConfiguredAdvancedProviders", () => {
  it("only returns configured AI providers", () => {
    const openai = provider(ProviderCodeName.OPENAI, true);
    const gemini = provider(ProviderCodeName.GEMINI, false);
    const deepl = provider(ProviderCodeName.DEEPL, true);

    expect(getConfiguredAdvancedProviders([openai, gemini, deepl])).toEqual([openai]);
  });
});
