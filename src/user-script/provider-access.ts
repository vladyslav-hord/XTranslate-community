import { ensureProSubscription } from "../background/user.bgc";
import { ProviderCodeName } from "../providers";

export async function ensureProviderAccess(provider: ProviderCodeName): Promise<boolean> {
  if (provider !== ProviderCodeName.XTRANSLATE_PRO) return true;
  return ensureProSubscription();
}
