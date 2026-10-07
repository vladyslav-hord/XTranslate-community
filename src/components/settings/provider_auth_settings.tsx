import React from "react";
import { observer } from "mobx-react";
import { getMessage } from "@/i18n";
import { StorageHelper } from "@/utils/storageHelper";
import { Button } from "../button";
import * as styles from "./provider_auth_settings.module.scss";

export interface ProviderAuthSettingsProps {
  provider: string;
  apiKey: StorageHelper<string>;
  modelSelector?: React.ReactNode;
  onApiKeyRemoved?(): void;
}

export function sanitizeApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return "*".repeat(apiKey.length);
  return `${apiKey.slice(0, 4)}*-*${apiKey.slice(-4)}`;
}

export const ProviderAuthSettings = observer(({ provider, apiKey, modelSelector, onApiKeyRemoved }: ProviderAuthSettingsProps) => {
  const key = apiKey.get() ?? "";

  function setupApiKey() {
    const prompt = [
      getMessage("auth_setup_key_info", { provider }),
      getMessage("auth_safety_warning_info"),
    ].filter(Boolean).join("\n\n");
    const newKey = window.prompt(prompt)?.trim();
    if (newKey) apiKey.set(newKey);
  }

  function clearApiKey() {
    if (window.confirm(getMessage("auth_clear_key_info", { provider }))) {
      apiKey.set("");
      onApiKeyRemoved?.();
    }
  }

  return (
    <div className={styles.ProviderAuthSettings}>
      {modelSelector}
      <div className={styles.keyControls}>
        {key ? (
          <>
            <span>API key: {sanitizeApiKey(key)}</span>
            <Button outline label="Change" onClick={setupApiKey}/>
            <Button outline label="Remove" onClick={clearApiKey}/>
          </>
        ) : (
          <Button outline label="Set API key" onClick={setupApiKey}/>
        )}
      </div>
    </div>
  );
});
