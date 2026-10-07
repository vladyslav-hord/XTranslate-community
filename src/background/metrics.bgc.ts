import type { PageId } from "../navigation";
import type { ProviderCodeName } from "../providers";
import { createIsomorphicAction, MessageType } from "../extension";

export const sendMetric = createIsomorphicAction({
  messageType: MessageType.GA_METRICS_SEND_EVENT,
  handler: disableCommunityMetrics,
});

export async function disableCommunityMetrics<EventName extends MetricName>(
  _eventName: EventName,
  _params: GoogleMetricEvents[EventName],
): Promise<void> {
  // Keep existing metric call sites/API intact without collecting or transmitting events.
}

export type MetricName = keyof GoogleMetricEvents;
export type MetricSourceEnv = "popup" | "translate_tab";

export type GoogleMetricEvents = {
  screen_view: {
    screen_name: PageId;
  };
  translate_used: {
    source: MetricSourceEnv | "fullpage";
    provider: ProviderCodeName;
    lang_from: string;
    lang_to: string;
  };
  translate_error: {
    source: MetricSourceEnv;
    provider: ProviderCodeName;
    lang_from: string;
    lang_to: string;
    error: string;
  };
  translate_action: {
    trigger: "icon" | "double_click" | "selection_click" | "selection_change" | "hotkey" | "provider_change";
  };
  tts_played: {
    source: MetricSourceEnv;
    provider: ProviderCodeName;
    lang?: string;
  };
  tts_error: {
    source: MetricSourceEnv;
    provider: ProviderCodeName;
    lang?: string;
    error: string;
  };
  history_saved: {
    source: MetricSourceEnv;
    provider: ProviderCodeName;
    lang_from: string;
    lang_to: string;
  };
  favorite_saved: {
    source: MetricSourceEnv | "history_list"
    provider: ProviderCodeName;
    lang_from: string;
    lang_to: string;
  };
  promo_banner_shown: {}
  promo_free_ai_translation_used: {}
  promo_free_ai_translation_limit_daily: {}
  promo_free_ai_translation_limit_total: {}
  promo_free_ai_login_clicked: {}
  promo_free_ai_hide_banner: {}
  ad_shown: { brand: string }
  ad_clicked: { brand: string }
};
