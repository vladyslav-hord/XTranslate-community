import { disableCommunityMetrics } from "./metrics.bgc";

jest.mock("../extension", () => ({
  createIsomorphicAction: ({ handler }: { handler: (...args: any[]) => unknown }) => handler,
  MessageType: { GA_METRICS_SEND_EVENT: "GA_METRICS_SEND_EVENT" },
}));

describe("community metrics", () => {
  it("does not send metric events over the network", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as Response);

    await disableCommunityMetrics("promo_banner_shown", {});

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
