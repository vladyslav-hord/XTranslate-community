import { proxyRequest } from "../background/httpProxy.bgc";
import { DeepSeekAIModel, GeminiAIModel, GrokAIModel, OpenAIModel, ProviderCodeName } from "./providers";
import { translateWithAI } from "./ai";

jest.mock("../background/httpProxy.bgc", () => ({
  proxyRequest: jest.fn(),
}));
jest.mock("../i18n", () => ({
  getMessage: (key: string) => key,
}));
jest.mock("../utils/createLogger", () => ({
  createLogger: jest.fn(() => ({ info: jest.fn(), error: jest.fn() })),
}));

import { createLogger } from "../utils/createLogger";
const mockedProxyRequest = proxyRequest as jest.Mock;
const mockLogger = (createLogger as jest.Mock).mock.results[0].value;
const apiKey = "test-api-key-never-log";
const params = {
  provider: "openai" as ProviderCodeName,
  apiBaseUrl: "https://api.openai.com/v1",
  apiKey,
  model: "gpt-6-luna",
  sourceLanguage: undefined as string | undefined,
  targetLanguage: "pl",
  text: "First line\nSecond line",
};

describe("translateWithAI", () => {
  beforeEach(() => mockedProxyRequest.mockReset());

  it("sends the original multiline text through the HTTP proxy and returns the popup shape", async () => {
    mockedProxyRequest.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ translation: "Pierwsza linia\nDruga linia", detectedLang: "en" }) } }],
    });

    await expect(translateWithAI(params)).resolves.toEqual({
      translation: "Pierwsza linia\nDruga linia",
      langDetected: "en",
      transcription: null,
      spellCorrection: null,
    });

    const [request] = mockedProxyRequest.mock.calls[0];
    expect(request.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(request.requestInit.headers).toEqual({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    });
    const body = JSON.parse(request.requestInit.body);
    expect(body).toMatchObject({
      model: "gpt-6-luna",
      response_format: { type: "json_object" },
    });
    expect(body.messages[1]).toEqual({ role: "user", content: params.text });
    expect(body.messages[0].content).toContain("automatically");
  });

  it.each([
    [ProviderCodeName.OPENAI, OpenAIModel.COST_EFFECTIVE, "none"],
    [ProviderCodeName.OPENAI, OpenAIModel.RECOMMENDED, "low"],
    [ProviderCodeName.GEMINI, GeminiAIModel.COST_EFFECTIVE, "low"],
    [ProviderCodeName.GEMINI, GeminiAIModel.RECOMMENDED, "low"],
    [ProviderCodeName.GROK, GrokAIModel.COST_EFFECTIVE, undefined],
    [ProviderCodeName.GROK, GrokAIModel.RECOMMENDED, "low"],
    [ProviderCodeName.DEEPSEEK, DeepSeekAIModel.COST_EFFECTIVE, "none"],
    [ProviderCodeName.DEEPSEEK, DeepSeekAIModel.RECOMMENDED, "none"],
  ])("sets translation reasoning policy for %s/%s", async (provider, model, expectedEffort) => {
    mockedProxyRequest.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ translation: "ok" }) } }],
    });

    await translateWithAI({ ...params, provider: provider as ProviderCodeName, model: model as string });

    const body = JSON.parse(mockedProxyRequest.mock.calls[0][0].requestInit.body);
    if (expectedEffort === undefined) {
      expect(body).not.toHaveProperty("reasoning_effort");
    } else {
      expect(body.reasoning_effort).toBe(expectedEffort);
    }
  });

  it("fails on malformed model output instead of returning the original text", async () => {
    mockedProxyRequest.mockResolvedValue({
      choices: [{ message: { content: "not JSON" } }],
    });

    await expect(translateWithAI(params)).rejects.toMatchObject({ statusCode: 502 });
  });

  it.each([
    [401, "error_403_auth_failed"],
    [403, "error_403_auth_failed"],
    [429, "AI API rate limit exceeded. Please try again later."],
    [503, "service unavailable"],
  ])("maps HTTP %i errors", async (statusCode, message) => {
    mockedProxyRequest.mockRejectedValue({ statusCode, message });

    await expect(translateWithAI(params)).rejects.toMatchObject({ statusCode, message });
  });

  it("converts a rejected network request to a structured error", async () => {
    mockedProxyRequest.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(translateWithAI(params)).rejects.toMatchObject({ statusCode: 0 });
  });

  it.each([
    { choices: [] },
    { choices: [{ message: { content: null } }] },
    { choices: [{ message: { content: JSON.stringify({ detectedLang: "en" }) } }] },
  ])("rejects incomplete model responses", async (response) => {
    mockedProxyRequest.mockResolvedValue(response);

    await expect(translateWithAI(params)).rejects.toMatchObject({ statusCode: 502 });
  });

  it("rejects an unknown selected model before making a request", async () => {
    await expect(translateWithAI({ ...params, model: "not-a-model" })).rejects.toMatchObject({ statusCode: 400 });
    expect(mockedProxyRequest).not.toHaveBeenCalled();
  });

  it("rejects a missing API key before making a request", async () => {
    await expect(translateWithAI({ ...params, apiKey: "" })).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedProxyRequest).not.toHaveBeenCalled();
  });

  it("never includes the API key in logged request failures", async () => {
    mockLogger.error.mockClear();
    mockedProxyRequest.mockRejectedValue({ statusCode: 401, message: `invalid ${apiKey}` });

    await expect(translateWithAI(params)).rejects.toMatchObject({ statusCode: 401 });

    expect(JSON.stringify(mockLogger.error.mock.calls)).not.toContain(apiKey);
  });

  it("includes an explicit source language in the prompt", async () => {
    mockedProxyRequest.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ translation: "Cześć", detectedLang: "en" }) } }],
    });

    await translateWithAI({ ...params, sourceLanguage: "English" });

    const body = JSON.parse(mockedProxyRequest.mock.calls[0][0].requestInit.body);
    expect(body.messages[0].content).toContain("Translate from English to pl.");
  });
});
