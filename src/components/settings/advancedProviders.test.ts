import { ProviderCodeName } from "../../providers/providers";
import { getAdvancedProviders, getRegularProviders } from "./advancedProviders";

const provider = (name: ProviderCodeName, available: boolean) => ({
  name,
  isAvailable: () => available,
});

describe("provider list grouping", () => {
  it("shows available providers, including configured AI providers, in the regular list", () => {
    const google = provider(ProviderCodeName.GOOGLE, true);
    const openai = provider(ProviderCodeName.OPENAI, true);
    const gemini = provider(ProviderCodeName.GEMINI, false);
    const xtranslatePro = provider(ProviderCodeName.XTRANSLATE_PRO, true);

    expect(getRegularProviders([google, openai, gemini, xtranslatePro])).toEqual([google, openai]);
  });

  it("keeps XTranslate PRO in the advanced list", () => {
    const deepl = provider(ProviderCodeName.DEEPL, true);
    const xtranslatePro = provider(ProviderCodeName.XTRANSLATE_PRO, true);
    const openai = provider(ProviderCodeName.OPENAI, true);

    expect(getAdvancedProviders([deepl, xtranslatePro, openai])).toEqual([xtranslatePro]);
  });
});
