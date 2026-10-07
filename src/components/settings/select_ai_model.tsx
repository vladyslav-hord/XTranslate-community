import React from "react";
import { getMessage } from "@/i18n";
import { ReactSelect, ReactSelectOption } from "../select";

export interface SelectAIModelProps {
  value: string;
  costEffectiveModel: string;
  recommendedModel: string;
  onChange(model: string): void;
}

export function SelectAIModel({ value, costEffectiveModel, recommendedModel, onChange }: SelectAIModelProps) {
  const options: ReactSelectOption<string>[] = [
    {
      value: costEffectiveModel,
      label: `${getMessage("ai_choose_model_cost_effective")} — ${costEffectiveModel}`,
    },
    {
      value: recommendedModel,
      label: `${getMessage("ai_choose_model_recommended")} — ${recommendedModel}`,
    },
  ];

  return (
    <div className="flex column">
      <small>{getMessage("ai_choose_model")}</small>
      <ReactSelect
        options={options}
        value={options.find(option => option.value === value)}
        onChange={({ value: model }) => onChange(model)}
      />
    </div>
  );
}
