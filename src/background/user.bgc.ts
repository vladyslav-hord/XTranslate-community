import { createIsomorphicAction, MessageType } from "../extension";
import { userStore } from "../pro";

export const userSubscriptionRefreshAction = createIsomorphicAction({
  messageType: MessageType.USER_SUBSCRIPTION_REFRESH,

  async handler({ force = false } = {}) {
    await userStore.whenReady;

    if (userStore.cacheResetRequired || force) {
      return await userStore.loadSubscriptionSafe();
    }
  }
});

export async function ensureProSubscription(): Promise<boolean> {
  await userSubscriptionRefreshAction({ force: true });
  if (userStore.isProActive) return true;

  userStore.showSubscribeDialog();
  return false;
}
