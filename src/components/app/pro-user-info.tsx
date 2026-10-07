import "./pro-user-info.scss";
import React from "react";
import { observer } from "mobx-react";
import { formatTime, cssNames } from "@/utils";
import { Icon } from "../icon";
import { formatNumber, getIntlLocale, getMessage } from "@/i18n";
import { userStore } from "@/pro";

export const ProUserInfo = observer(ProUserInfoRaw);

export function ProUserInfoRaw() {
  const {
    user,
    subscription,
    isProActive,
    remainTextTokens,
    remainSecondsTTSRoughly,
    isProExpired,
  } = userStore;

  if (isProActive || isProExpired) {
    const expirationDate = new Date(subscription.periodEnd).toLocaleString(getIntlLocale());

    const subscriptionActiveTooltip = (
      <>
        <p>
          {getMessage("pro_user_subscription", {
            plan: subscription.planType,
            periodEnd: expirationDate,
          })}
        </p>
        <p>
          {getMessage("pro_user_remain_text_tokens", {
            tokens: formatNumber({ value: remainTextTokens })
          })}
        </p>
        <p>
          {
            getMessage("pro_user_remain_tts_seconds_approx", {
              timeRange: formatTime(remainSecondsTTSRoughly),
            })
          }
        </p>
      </>
    );

    const subscriptionDeactivatedTooltip = (
      <>
        {getMessage("pro_user_subscription_inactive", {
          plan: subscription.planType,
          status: subscription.cycleStatus,
          periodEnd: expirationDate,
        })}
      </>
    );

    const subscriptionInfoTooltip = isProActive
      ? subscriptionActiveTooltip
      : subscriptionDeactivatedTooltip;

    return (
      <div className="ProUserInfo flex column">
        <div className="pro-greeting">
          {getMessage("pro_user_welcome_back", {
            username: <em>{user.username}</em>,
          })}
        </div>
        <div className="flex align-center">
          <Icon small material="info_outline" tooltip={{
            following: true,
            children: subscriptionInfoTooltip,
          }}/>
          <div>
            {getMessage("pro_user_status", {
              status: (
                <b className={cssNames("pro-status", { active: isProActive, expired: isProExpired })}>
                  {getMessage(`pro_user_status_${subscription.status}`)}
                </b>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return null;
}
