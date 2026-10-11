import "./input-translation.scss";
import isEqual from "lodash/isEqual";
import React, { Fragment } from "react";
import { action, comparer, IReactionDisposer, makeObservable, observable, reaction, runInAction, toJS } from "mobx";
import { observer } from "mobx-react";
import { getTranslator, getXTranslatePro, isRTL, ITranslationError, ITranslationResult, ProviderCodeName, Translator } from "@/providers";
import { cssNames, isHotkeyPressed } from "@/utils";
import { SelectLanguage } from "../select-language";
import { Input } from "../input";
import { Spinner } from "../spinner";
import { settingsStore } from "../settings/settings.storage";
import { pageManager } from "../app/page-manager";
import { Tab } from "../tabs";
import { Icon } from "../icon";
import { Tooltip } from "../tooltip";
import { getUrlParams, navigation, TranslationPageParams } from "@/navigation";
import { createStorage } from "@/storage";
import { getMessage } from "@/i18n";
import { materialIcons } from "@/config";
import { isFavorite } from "../user-history/favorites.storage";
import { saveToFavoritesAction } from "@/background/history.bgc";
import { getSelectedTextAction } from "@/background/selected-text.bgc";
import { CopyToClipboardIcon } from "../copy-to-clipboard-icon";
import { SelectProvider } from "../select-provider";
import { Button } from "@/components/button";
import { ensureProSubscription } from "@/background/user.bgc";
import { sendMetric } from "@/background/metrics.bgc";
import {
  canSummarizeWithProvider,
  getDetectedSourceLanguage,
  getTranslateTabSelection,
  isTranslationForParams,
  saveTranslateTabPair,
  TranslateTabPreferences,
} from "./translate-tab-logic";

@observer
export class InputTranslation extends React.Component {
  private input?: Input;
  private unBindAutoTranslate?: IReactionDisposer;
  private unBindStaleResults?: IReactionDisposer;
  private lastParams?: TranslationPageParams;
  private translationPromise?: Promise<void>;
  private speakingProvider?: ProviderCodeName;
  private lastInputText = createStorage<string>("last_input_text");
  private translateTabPreferences = createStorage<TranslateTabPreferences>("translate_tab_preferences", {
    defaultValue: {},
  });

  private get currentTranslation(): ITranslationResult | undefined {
    return isTranslationForParams(this.params, this.translation) ? this.translation : undefined;
  }

  private get currentDetectedSourceLang(): string | undefined {
    const params = this.params;
    if (!params) return;
    const detected = getDetectedSourceLanguage(params, this.currentTranslation);
    return detected && getTranslator(params.provider)?.langFrom[detected] ? detected : undefined;
  }

  get urlParams(): TranslationPageParams {
    const { provider, text, to, from } = getUrlParams<TranslationPageParams>();
    return { page: "translate", provider, from, to, text };
  }

  @observable isLoading = false;
  @observable params?: TranslationPageParams;
  @observable.ref translation?: ITranslationResult;
  @observable.ref error?: ITranslationError;
  @observable summarized = "";
  @observable isSpeaking = false;
  @observable isPaused = false;

  constructor(props: object) {
    super(props);
    makeObservable(this);
  }

  componentDidMount() {
    this.bindStaleResultCleanup();
    this.bindAutoTranslate();
    void this.checkUserSelectionFromActiveTabAndTranslateIfAny();
  }

  componentWillUnmount() {
    this.unBindAutoTranslate?.();
    this.unBindStaleResults?.();
  }

  private bindStaleResultCleanup() {
    this.unBindStaleResults = reaction(() => toJS(this.params), params => {
      runInAction(() => {
        if (this.translation && !isTranslationForParams(params, this.translation)) {
          this.translation = null;
        }
        this.summarized = "";
        this.error = null;
        this.resetSpeakingState();
      });
    }, { equals: comparer.structural });
  }

  private async checkUserSelectionFromActiveTabAndTranslateIfAny() {
    const { rememberLastText, vendor, langFrom, langTo, textInputAutoTranslateEnabled } = settingsStore.data;
    await this.translateTabPreferences.load();
    const selection = getTranslateTabSelection(
      { provider: vendor, from: langFrom, to: langTo },
      this.translateTabPreferences.get(),
      this.urlParams,
      (provider, from, to) => {
        const supported = getTranslator(provider).getSupportedLanguages({ langFrom: from, langTo: to });
        return { from: supported.langFrom, to: supported.langTo };
      },
    );
    this.params = {
      page: "translate",
      ...selection,
      text: this.urlParams.text ?? "",
    };
    this.saveTranslateTabSelection(selection.provider, selection.from, selection.to);

    await this.lastInputText.load();
    const selectedText = await getSelectedTextAction();
    const lastUserInputText = rememberLastText ? this.lastInputText.get() : "";
    const text = selectedText || lastUserInputText;

    if (text) {
      this.params.text = text;
    }

    if (textInputAutoTranslateEnabled) {
      void this.translate();
    }
  }

  private bindAutoTranslate() {
    this.unBindAutoTranslate = reaction(() => toJS(this.params), (params: TranslationPageParams) => {
      if (!settingsStore.data.textInputAutoTranslateEnabled) return;
      void this.translate(params);
    }, {
      equals: comparer.structural,
      delay: settingsStore.data.textInputTranslateDelayMs,
    });
  }

  @action.bound
  resetSpeakingState() {
    this.isSpeaking = false;
    this.isPaused = false;
    this.speakingProvider = undefined;
  }

  @action.bound
  speak = async () => {
    if (this.isSpeaking) return this.toggleSpeaking();

    const params = { ...this.params };
    if (!params.text) return;

    let translation = this.currentTranslation;
    if (params.from === "auto" && !translation) {
      await this.translate({ ...params });
      translation = this.currentTranslation;
    }
    if (!isEqual(params, this.params)) return;

    const lang = params.from === "auto"
      ? getDetectedSourceLanguage(params, translation)
      : params.from;
    if (!lang || !getTranslator(params.provider)?.langFrom[lang]) return;

    return this.speakText(params.text, lang, params.provider);
  };

  @action.bound
  speakTranslation = async () => {
    if (this.isSpeaking) return this.toggleSpeaking();

    const translation = this.currentTranslation;
    if (!translation?.translation) return;

    return this.speakText(
      translation.translation,
      translation.langTo || this.params.to,
      translation.vendor || this.params.provider,
    );
  };

  @action.bound
  private async toggleSpeaking() {
    const translator = getTranslator(this.speakingProvider ?? this.params?.provider);
    if (!translator) return this.resetSpeakingState();

    this.isPaused = !this.isPaused;
    try {
      await translator.pauseSpeaking();
    } catch (error) {
      console.error("Text-to-speech pause/resume failed", error);
      this.resetSpeakingState();
    }
  }

  @action.bound
  private async speakText(text: string, lang: string, provider: ProviderCodeName) {
    const translator = getTranslator(provider);
    if (!translator) return;

    try {
      this.isSpeaking = true;
      this.isPaused = false;
      this.speakingProvider = provider;

      const media = await translator.speak(text, lang);
      if (media instanceof HTMLAudioElement) {
        media.onended = this.resetSpeakingState;
        media.onerror = () => {
          console.error("Text-to-speech audio playback failed", media.error);
          this.resetSpeakingState();
        };
        if (media.ended) this.resetSpeakingState();
      } else if (media instanceof SpeechSynthesisUtterance) {
        media.onend = this.resetSpeakingState;
        media.onerror = event => {
          console.error("Text-to-speech synthesis failed", event.error);
          this.resetSpeakingState();
        };
      } else {
        this.resetSpeakingState();
      }
    } catch (error) {
      console.error("Text-to-speech failed", error);
      this.resetSpeakingState();
    }
  }

  @action.bound
  translateText(text: string) {
    this.params.text = text;
    return this.translate();
  }

  @action.bound
  async translate(params = { ...this.params }) {
    this.summarized = "";

    if (!params.text) return;
    if (isEqual(this.lastParams, params)) {
      if (this.isLoading && this.translationPromise) {
        await this.translationPromise;
        return;
      }
      if (isTranslationForParams(params, this.translation)) return;
    }

    this.input?.focus(); // autofocus input-field
    this.input?.setValue(params.text); // update input value manually since @defaultValue is utilized
    this.translation = null;
    this.error = null;
    this.isLoading = true;
    this.lastParams = params;

    this.translationPromise = (async () => {
      try {
        const translation = await getTranslator(params.provider).translate({
          from: params.from,
          to: params.to,
          text: params.text.trim(),
          mode: "lookup",
        });
        if (isEqual(params, this.params)) {
          this.translation = translation;
          void sendMetric("translate_used", {
            source: "translate_tab",
            provider: params.provider,
            lang_from: params.from,
            lang_to: params.to,
          });
        }
      } catch (error) {
        if (isEqual(params, this.params)) {
          this.error = error;
          void sendMetric("translate_error", {
            error: String(this.error?.message ?? error),
            source: "translate_tab",
            provider: params.provider,
            lang_from: params.from,
            lang_to: params.to,
          });
        }
      } finally {
        this.isLoading = false;
        this.updateUrl(params);
      }
    })();
    await this.translationPromise;
  }

  private saveTranslateTabSelection(provider: ProviderCodeName, from: string, to: string) {
    this.translateTabPreferences.set(
      saveTranslateTabPair(this.translateTabPreferences.get(), provider, from, to),
    );
  }

  private updateUrl(newParams = this.params) {
    if (!isEqual(this.urlParams, newParams)) {
      navigation.searchParams.replace(newParams);
    }
  }

  @action
  onLangChange = (from: string, to: string) => {
    this.params.from = from;
    this.params.to = to;
    this.saveTranslateTabSelection(this.params.provider, from, to);
    this.updateUrl();
    this.resetSpeakingState();
  }

  @action
  onProviderChange = async (provider: ProviderCodeName) => {
    if (provider === ProviderCodeName.XTRANSLATE_PRO && !(await ensureProSubscription())) return;

    const translator = getTranslator(provider);
    const { textInputAutoTranslateEnabled } = settingsStore.data;
    const savedPair = this.translateTabPreferences.get().languages?.[provider];
    const supportedLanguages = translator.getSupportedLanguages({
      langFrom: savedPair?.from ?? this.params.from,
      langTo: savedPair?.to ?? this.params.to,
    });

    runInAction(() => {
      this.params.provider = provider;
      this.params.from = supportedLanguages.langFrom;
      this.params.to = supportedLanguages.langTo;
      this.saveTranslateTabSelection(provider, supportedLanguages.langFrom, supportedLanguages.langTo);
      this.updateUrl();
      this.resetSpeakingState();
    });

    if (textInputAutoTranslateEnabled) {
      void this.translate();
    }
  }

  private saveToFavorites = (isFavorite: boolean) => {
    void saveToFavoritesAction({
      item: this.translation,
      isFavorite: isFavorite,
      source: "translate_tab",
    });
  }

  renderTranslationResult() {
    const { langTo, langDetected, translation, originalText, transcription, dictionary, spellCorrection, sourceLanguages, vendor } = this.translation;
    const translator = getTranslator(vendor);
    const favorite = isFavorite(this.translation);
    const translationDirection = Translator.getLangPairTitleShort(langDetected, langTo);

    return (
      <div className={cssNames("translation-results", { rtl: isRTL(langTo) })}>
        {translation ?
          <div className="translation flex gaps align-center">
            <div className="action-icons flex column gaps">
              <Icon
                material={this.isPaused ? materialIcons.ttsPause : materialIcons.ttsPlay}
                tooltip={getMessage("popup_play_icon_title")}
                onClick={this.speakTranslation}
              />
              <CopyToClipboardIcon
                content={this.translation}
                tooltip={getMessage("popup_copy_translation_title")}
              />
              {vendor === ProviderCodeName.XTRANSLATE_PRO && (
                <Icon
                  material="audio_file"
                  tooltip={getMessage("popup_download_tts_icon_title")}
                  onClick={() => translator.downloadAudio(originalText, langDetected)}
                />
              )}
            </div>
            <div className="value box grow">
              <span>{translation}</span>
              {transcription ? <i className="transcription">[{transcription}]</i> : null}
            </div>
            <div className="flex column align-center">
              <Icon
                material={favorite ? materialIcons.favorite : materialIcons.unfavorite}
                tooltip={favorite ? getMessage("history_unmark_as_favorite") : getMessage("history_mark_as_favorite")}
                onClick={() => this.saveToFavorites(!favorite)}
              />
              <div className="lang" id="translated_with">
                {translationDirection}
                <Tooltip anchorId="translated_with" following nowrap>
                  {getMessage("translated_with", {
                    translator: translator.title,
                    lang: translator.getLangPairTitle(langDetected, langTo),
                  })}
                </Tooltip>
              </div>
            </div>
          </div>
          : null}
        {spellCorrection ? (
          <div className="spell-correction">
            {getMessage("spell_correction", {
              suggestion: (
                <b key="correction" className="link" onClick={() => this.translateText(spellCorrection)}>
                  {spellCorrection}
                </b>
              )
            })}
          </div>
        ) : null}
        {sourceLanguages?.length > 0 && (
          <div className="source-languages">
            {`${getMessage("translate_also_from")}: `}
            {sourceLanguages.map(lang => {
              if (lang === langDetected) return; // skip language for current results
              return (
                <b key={lang} className="link" onClick={action(() => this.params.from = lang)}>
                  {translator.langFrom[lang]}
                </b>
              )
            })}
          </div>
        )}
        <table className="dictionary">
          <tbody>
          {dictionary.map(({ wordType, meanings }) => {
            return (
              <Fragment key={wordType}>
                <tr>
                  <td className="word-type" colSpan={2}>{wordType}</td>
                </tr>
                {meanings.map(meaning => {
                  const examples: React.ReactNode = meaning.examples
                    ? meaning.examples.map((example, index) => <p key={index}>{example.join(" - ")}</p>)
                    : "";
                  return (
                    <tr key={meaning.word}>
                      <td className="word">
                        <span className="link" onClick={action(() => {
                          this.params.from = langTo;
                          this.params.to = langDetected;
                          this.translateText(meaning.word);
                        })}>
                          {meaning.word}
                        </span>{" "}
                        {examples && <Icon small material="info_outline" tooltip={examples}/>}
                      </td>
                      <td className="word-meanings">
                        {meaning.translation.map((word, i, list) => {
                          const last = i === list.length - 1;
                          return [
                            <span key={i} className="link" onClick={() => this.translateText(word)}>{word}</span>,
                            !last ? ", " : null
                          ];
                        })}
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            )
          })}
          </tbody>
        </table>
      </div>
    )
  }

  renderTranslationError() {
    const { statusCode, message } = this.error;
    return (
      <div className="translation-error flex column gaps">
        <p>{statusCode}: {getMessage("translation_data_failed")}</p>
        <p>{message}</p>
      </div>
    );
  }

  renderSummarizeResult() {
    return (
      <div className={cssNames("translation-results", { rtl: isRTL(this.params.to) })}>
        {this.summarized}
      </div>
    )
  }

  renderTranslation() {
    const { params, isLoading, error, summarized } = this;
    if (!params.text) return;
    if (isLoading) return <Spinner center/>;
    if (this.currentTranslation) return this.renderTranslationResult();
    if (summarized) return this.renderSummarizeResult();
    if (error) return this.renderTranslationError();
  }

  @action.bound
  setTranslationDelay() {
    const currentDelay = settingsStore.data.textInputTranslateDelayMs;
    const delayInput = window.parseInt(
      window.prompt(getMessage("translation_delay_info"), String(currentDelay))
    );

    if (isNaN(delayInput)) {
      return;
    }
    settingsStore.data.textInputTranslateDelayMs = delayInput;
  }

  @action.bound
  onInputChange(val: string) {
    this.params.text = val;
    if (this.error) {
      this.error = null; // reset previous error first (if any)
    }
    if (settingsStore.data.rememberLastText) {
      this.lastInputText.set(val);
    }
  }

  @action
  async summarize() {
    if (!canSummarizeWithProvider(this.params.provider)) return;
    if (!(await ensureProSubscription())) return;

    const params = { ...this.params };
    const { to: langTo, text } = params;
    if (!text) return;

    this.isLoading = true;
    this.error = null;
    this.translation = null;

    try {
      this.unBindAutoTranslate?.();
      const summarized = await getXTranslatePro().summarize({ text, targetLang: langTo });
      if (isEqual(params, this.params)) {
        this.summarized = summarized;
      }
    } catch (err) {
      if (isEqual(params, this.params)) {
        this.error = err;
      }
    } finally {
      this.bindAutoTranslate();
      this.isLoading = false;
      if (settingsStore.data.textInputAutoTranslateEnabled && !isEqual(params, this.params)) {
        void this.translate();
      }
    }
  }

  @action.bound
  toggleAutoTranslation() {
    settingsStore.data.textInputAutoTranslateEnabled = !settingsStore.data.textInputAutoTranslateEnabled;
  }

  @action.bound
  bindInputRef(elem: Input) {
    this.input = elem;
  }

  render() {
    if (!this.params) return;
    const { textInputTranslateDelayMs: delayMs, rememberLastText, textInputAutoTranslateEnabled } = settingsStore.data;

    const { provider, from: langFrom, to: langTo, text } = this.params;
    const ttsClassButton = cssNames("flex gaps align-center", {
      ttsPaused: this.isPaused,
    });

    return (
      <div className="InputTranslation flex column gaps">
        <div className="language flex gaps">
          <SelectLanguage
            className="box grow"
            provider={provider}
            from={langFrom}
            to={langTo}
            detectedSourceLang={this.currentDetectedSourceLang}
            onChange={({ langTo, langFrom }) => this.onLangChange(langFrom, langTo)}
          />
          <SelectProvider
            value={provider}
            onChange={this.onProviderChange}
            filter={provider => provider.isAvailable()}
          />
        </div>
        <div className="flex gaps align-center">
          <Input
            className="input"
            autoFocus={true}
            multiLine={true}
            rows={2}
            placeholder={getMessage("text_field_placeholder")}
            defaultValue={text}
            onChange={this.onInputChange}
            onKeyDown={evt => isHotkeyPressed({ key: "Enter" }, evt) && this.translate()}
            ref={this.bindInputRef}
            infoContent={(
              <small className="hint">
                {getMessage(textInputAutoTranslateEnabled ? "text_input_auto_translation_enabled" : "text_input_auto_translation_disabled", {
                  toggle: v => <a onClick={this.toggleAutoTranslation}><b>{v}</b></a>
                })}
                {" | "}
                {getMessage("text_input_auto_translation_timeout", {
                  timeout: <a onClick={this.setTranslationDelay}><b>{delayMs || 0}</b></a>,
                })}
              </small>
            )}
          />
          <Icon
            className="rememberTextIcon"
            material={rememberLastText ? "bookmark" : "bookmark_border"}
            active={rememberLastText}
            tooltip={{ nowrap: true, children: getMessage("remember_last_typed_text") }}
            onClick={action(() => settingsStore.data.rememberLastText = !rememberLastText)}
          />
        </div>

        {this.renderTranslation()}

        <div className="buttons flex gaps justify-center">
          <Button
            primary
            className="flex gaps align-center"
            onClick={() => this.translate()}
          >
            <Icon material={materialIcons.translate}/>
            <span>{getMessage("translate_button")}</span>
          </Button>
          <Button
            outline
            className={ttsClassButton}
            onClick={() => this.speak()}
          >
            <Icon svg="tts"/>
            <span>{getMessage("tts_button")}</span>
          </Button>
          {canSummarizeWithProvider(provider) && (
            <Button
              className="flex gaps align-center"
              onClick={() => this.summarize()}
            >
              <Icon material={materialIcons.summarize}/>
              <span>{getMessage("summarize_button")}</span>
            </Button>
          )}
        </div>
      </div>
    );
  }
}

pageManager.registerComponents("translate", {
  Tab: props => <Tab {...props} label={getMessage("tab_text_input")} icon="translate"/>,
  Page: InputTranslation,
});
