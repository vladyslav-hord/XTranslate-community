import { createLogger } from "../utils/createLogger";
import { proxyRequest } from "../background/httpProxy.bgc";
import { ProxyResponseType } from "../extension/messages";
import { getMessage } from "../i18n";
import { OpenAIModel, GeminiAIModel, GrokAIModel, DeepSeekAIModel, ProviderCodeName } from "./providers";
import type { ITranslationError, ITranslationResult } from "./translator";

export interface TranslateWithAIParams {
  provider: ProviderCodeName;
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  sourceLanguage?: string;
  targetLanguage: string;
  text: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

const modelIdsByProvider: Partial<Record<ProviderCodeName, readonly string[]>> = {
  [ProviderCodeName.OPENAI]: Object.values(OpenAIModel),
  [ProviderCodeName.GEMINI]: Object.values(GeminiAIModel),
  [ProviderCodeName.GROK]: Object.values(GrokAIModel),
  [ProviderCodeName.DEEPSEEK]: Object.values(DeepSeekAIModel),
};

const logger = createLogger({ systemPrefix: "[AI TRANSLATOR]" });

function makeTranslationError(statusCode: number, message: string): ITranslationError {
  return { statusCode, message };
}

function getEndpoint(apiBaseUrl: string): string {
  return `${apiBaseUrl.replace(/\/+$/, "")}/chat/completions`;
}

function buildSystemPrompt(sourceLanguage: string | undefined, targetLanguage: string): string {
  const source = sourceLanguage
    ? `Translate from ${sourceLanguage} to ${targetLanguage}.`
    : `Detect the source language automatically and translate to ${targetLanguage}.`;

  return [
    "You are a translation engine.",
    source,
    "Preserve meaning, tone, punctuation, and line breaks. Do not add explanations or surrounding text.",
    'Return one JSON object with a string "translation" and the detected source language in "detectedLang".',
  ].join(" ");
}

function parseTranslation(content: string): Pick<ITranslationResult, "translation" | "langDetected"> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw makeTranslationError(502, "AI provider returned invalid JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw makeTranslationError(502, "AI provider returned an invalid translation response.");
  }

  const result = parsed as { translation?: unknown; detectedLang?: unknown };
  if (typeof result.translation !== "string" || !result.translation.trim()) {
    throw makeTranslationError(502, "AI provider response is missing a translation.");
  }

  return {
    translation: result.translation,
    langDetected: typeof result.detectedLang === "string" ? result.detectedLang : undefined,
  };
}

function safeErrorMessage(error: unknown, apiKey: string): string {
  const message = typeof (error as any)?.message === "string"
    ? (error as any).message
    : "AI provider request failed.";
  return apiKey ? message.split(apiKey).join("[REDACTED]") : message;
}

function mapRequestError(error: unknown, apiKey: string): ITranslationError {
  const statusCode = Number.isInteger((error as any)?.statusCode)
    ? (error as any).statusCode
    : 0;

  if (statusCode === 401 || statusCode === 403) {
    return makeTranslationError(statusCode, getMessage("error_403_auth_failed"));
  }
  if (statusCode === 429) {
    return makeTranslationError(statusCode, "AI API rate limit exceeded. Please try again later.");
  }
  return makeTranslationError(statusCode, safeErrorMessage(error, apiKey));
}

export async function translateWithAI({
  provider,
  apiBaseUrl,
  apiKey,
  model,
  sourceLanguage,
  targetLanguage,
  text,
}: TranslateWithAIParams): Promise<ITranslationResult> {
  if (!apiKey) {
    throw makeTranslationError(403, getMessage("error_403_auth_failed"));
  }

  if (!modelIdsByProvider[provider]?.includes(model)) {
    throw makeTranslationError(400, `Unknown selected model for ${provider}.`);
  }

  const endpoint = getEndpoint(apiBaseUrl);
  const request = {
    url: endpoint,
    responseType: ProxyResponseType.JSON,
    requestInit: {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(sourceLanguage, targetLanguage) },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
      }),
    },
  } as const;

  try {
    const response = await proxyRequest<ChatCompletionResponse>(request);
    const responseStatus = (response as any)?.statusCode;
    if (Number.isInteger(responseStatus) && (responseStatus < 200 || responseStatus >= 300)) {
      throw response;
    }

    const content = response?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw makeTranslationError(502, "AI provider returned no translation content.");
    }

    const parsedTranslation = parseTranslation(content);
    return {
      ...parsedTranslation,
      detectedLang: parsedTranslation.langDetected,
      transcription: null,
      spellCorrection: null,
    };
  } catch (error) {
    const mappedError = mapRequestError(error, apiKey);
    logger.error("translation request failed", {
      provider,
      model,
      endpoint,
      statusCode: mappedError.statusCode,
      message: safeErrorMessage(mappedError, apiKey),
    });
    throw mappedError;
  }
}
