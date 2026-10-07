import { ensureProSubscription } from "../background/user.bgc";
import { ensureProviderAccess } from "./provider-access";
import { ProviderCodeName } from "../providers";

jest.mock("../background/user.bgc", () => ({
  ensureProSubscription: jest.fn(),
}));
jest.mock("../providers", () => ({
  ProviderCodeName: {
    GOOGLE: "google",
    XTRANSLATE_PRO: "xtranslate_pro",
  },
}));

describe("ensureProviderAccess", () => {
  beforeEach(() => {
    (ensureProSubscription as jest.Mock).mockReset();
  });

  it("blocks XTranslate PRO when the subscription check fails", async () => {
    (ensureProSubscription as jest.Mock).mockResolvedValue(false);

    await expect(ensureProviderAccess(ProviderCodeName.XTRANSLATE_PRO)).resolves.toBe(false);
    expect(ensureProSubscription).toHaveBeenCalledTimes(1);
  });

  it("allows XTranslate PRO only after the subscription check succeeds", async () => {
    (ensureProSubscription as jest.Mock).mockResolvedValue(true);

    await expect(ensureProviderAccess(ProviderCodeName.XTRANSLATE_PRO)).resolves.toBe(true);
  });

  it("does not refresh the subscription for other providers", async () => {
    await expect(ensureProviderAccess(ProviderCodeName.GOOGLE)).resolves.toBe(true);
    expect(ensureProSubscription).not.toHaveBeenCalled();
  });
});
