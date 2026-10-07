import { ensureProSubscription, userSubscriptionRefreshAction } from "./user.bgc";
import { userStore } from "../pro";

jest.mock("../extension", () => ({
  createIsomorphicAction: () => jest.fn(),
  MessageType: { USER_SUBSCRIPTION_REFRESH: "USER_SUBSCRIPTION_REFRESH" },
}));
jest.mock("../pro", () => ({
  userStore: {
    isProActive: false,
    showSubscribeDialog: jest.fn(),
  },
}));

describe("ensureProSubscription", () => {
  beforeEach(() => {
    (userSubscriptionRefreshAction as jest.Mock).mockReset();
    (userStore.showSubscribeDialog as jest.Mock).mockClear();
    (userStore as any).isProActive = false;
  });

  it("refreshes remote subscription before allowing PRO", async () => {
    const refresh = userSubscriptionRefreshAction as jest.Mock;
    refresh.mockImplementation(async () => {
      (userStore as any).isProActive = true;
    });

    await expect(ensureProSubscription()).resolves.toBe(true);
    expect(refresh).toHaveBeenCalledWith({ force: true });
    expect(userStore.showSubscribeDialog).not.toHaveBeenCalled();
  });

  it("shows subscribe dialog only after refreshed subscription is inactive", async () => {
    const refresh = userSubscriptionRefreshAction as jest.Mock;
    refresh.mockResolvedValue(undefined);
    (userStore as any).isProActive = false;

    await expect(ensureProSubscription()).resolves.toBe(false);
    expect(refresh).toHaveBeenCalledWith({ force: true });
    expect(userStore.showSubscribeDialog).toHaveBeenCalledTimes(1);
  });
});
