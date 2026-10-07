import { ProviderCodeName } from "../../providers/providers";

const AI_PROVIDER_NAMES = new Set<ProviderCodeName>([
  ProviderCodeName.OPENAI,
  ProviderCodeName.GEMINI,
  ProviderCodeName.GROK,
  ProviderCodeName.DEEPSEEK,
]);

type ProviderAvailability = {
  name: ProviderCodeName;
  isAvailable(): boolean;
};

export function isAIProvider(provider: ProviderAvailability): boolean {
  return AI_PROVIDER_NAMES.has(provider.name);
}

export function getRegularProviders<T extends ProviderAvailability>(providers: T[]): T[] {
  return providers.filter(provider => provider.name !== ProviderCodeName.XTRANSLATE_PRO && provider.isAvailable());
}

export function getAdvancedProviders<T extends ProviderAvailability>(providers: T[]): T[] {
  return providers.filter(provider => provider.name === ProviderCodeName.XTRANSLATE_PRO && provider.isAvailable());
}
