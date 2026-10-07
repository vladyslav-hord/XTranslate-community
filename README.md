# XTranslate Community

An open-source browser translation extension for selected text, full webpages, PDFs, and multiple translation providers.

## Why this project exists

XTranslate Community exists to preserve provider choice and useful functionality that was removed from upstream XTranslate. It restores DeepL support and bring-your-own-key (BYOK) AI providers while continuing to track useful upstream improvements where practical.

This is an independently maintained community edition, not an attempt to impersonate or replace the original commercial service.

## What's different

- Restored DeepL API support.
- BYOK OpenAI, Gemini, Grok, and DeepSeek providers.
- Provider API keys are stored locally by the browser extension.
- Community usage analytics are disabled; the extension does not send usage events to the original project's Google Analytics property.
- Community-focused identity and UI.
- XTranslate PRO remains available only as an external compatibility option.

## Features

- Translate selected text by double-click, hotkey, selection icon, or manual input.
- Translate full webpages where the selected provider supports it.
- Translate PDF text.
- Keep translation history and favorites.
- Text-to-speech for providers that support it.
- Customize themes and translation behavior.

## Translation providers

| Provider | Setup | Full-page | Notes |
| --- | --- | --- | --- |
| Google | Built in; ready to use | Yes | No key required |
| Bing | Built in; ready to use | Yes | No key required |
| DeepL | Your DeepL API key | Yes | Uses the restored batch translation path |
| OpenAI | Your API key (BYOK) | No | Text translation only for now |
| Gemini | Your API key (BYOK) | No | Text translation only for now |
| Grok | Your API key (BYOK) | No | Text translation only for now |
| DeepSeek | Your API key (BYOK) | No | Text translation only for now |
| XTranslate PRO | External paid service | Service-dependent | Compatibility integration; operated by the original XTranslate project |

## Installation

There is no XTranslate Community store listing yet. To try the extension locally:

1. Install [Node.js 24 or later](https://nodejs.org/).
2. Run `npm ci`.
3. Run `npm run build`.
4. In your browser's extension management page, enable developer mode and load the generated extension from `dist` as an unpacked extension.

Packaged community builds may be distributed through GitHub Releases in the future; no release is available yet.

## API keys and privacy

DeepL, OpenAI, Gemini, Grok, and DeepSeek require your own provider API key. These keys are stored in `chrome.storage.local`, not browser sync storage, and the extension does not intentionally log API keys. Translation requests are sent to the selected provider's API through the extension's background HTTP proxy. The selected provider receives the text you ask it to translate and handles it according to its own policies.

XTranslate Community does not send usage analytics to the original project's Google Analytics property. This describes the Community extension's own analytics behavior; it does not change the data handling policies of external providers or XTranslate PRO.

## XTranslate PRO

XTranslate PRO is an external commercial service operated by the original XTranslate project. XTranslate Community does not operate the service, manage subscriptions, or control its availability. Selecting it can communicate with `xtranslate.dev`; the upstream project can change or discontinue compatibility independently.

## Development

The project uses TypeScript, React, MobX, and Webpack.

```sh
npm ci
npm run dev
npm test
npm run build
```

## Upstream and license

This codebase is based on **XTranslate** by **ixrock** ([ixrock/XTranslate](https://github.com/ixrock/XTranslate)). The repository history is retained for attribution. The upstream package metadata declares the MIT License; XTranslate Community modifications are also distributed under MIT. See [LICENSE](LICENSE) for the license text. Copyright attribution for the Community modifications is limited to the work identified there; no historical upstream copyright notice is asserted.

XTranslate Community is independently maintained by [Vladyslav Hord](https://github.com/vladyslav-hord) and is not affiliated with or endorsed by the original XTranslate project, DeepL, OpenAI, Google, xAI, or DeepSeek. Product and company names are used only to identify compatible services.

Screenshots: [screenshots/Untitled-1.jpg](screenshots/Untitled-1.jpg).
