import type { PageAnalysis, PageFieldCandidate, PageFieldCategory } from "../lib/types";

type InsertMessage = {
  type: "INSERT_TEXT";
  text: string;
  fieldId?: string;
};

type AnalyzeMessage = {
  type: "ANALYZE_PAGE";
};

type RuntimeMessage = InsertMessage | AnalyzeMessage;

const FIELD_ID_ATTRIBUTE = "data-es-tapfill-field-id";
const MAX_FIELDS = 40;
const MAX_TEXT_LENGTH = 12000;
const MAX_LABEL_LENGTH = 420;

let currentTarget: HTMLElement | null = null;
let nextFieldIndex = 1;
const windowWithFlag = window as Window & { __esTapfillContentScriptLoaded__?: boolean };

function isTextInput(element: Element): element is HTMLInputElement {
  if (!(element instanceof HTMLInputElement)) {
    return false;
  }

  const type = (element.type || "text").toLowerCase();
  return ["email", "number", "search", "tel", "text", "url"].includes(type);
}

function getSupportedTarget(element: Element | null): HTMLElement | null {
  if (!element) {
    return null;
  }

  if (isTextInput(element) || element instanceof HTMLTextAreaElement) {
    return element;
  }

  if (element instanceof HTMLElement && element.isContentEditable) {
    return element.closest<HTMLElement>('[contenteditable="true"], [contenteditable=""]') ?? element;
  }

  return null;
}

if (!windowWithFlag.__esTapfillContentScriptLoaded__) {
  windowWithFlag.__esTapfillContentScriptLoaded__ = true;

  currentTarget = getSupportedTarget(document.activeElement);

  document.addEventListener("focusin", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const supportedTarget = getSupportedTarget(target);
    if (supportedTarget) {
      currentTarget = supportedTarget;
    }
  });

  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    if (message.type === "ANALYZE_PAGE") {
      sendResponse({ success: true, analysis: analyzePage() });
      return true;
    }

    if (message.type === "INSERT_TEXT") {
      const result = insertText(message.text, message.fieldId);
      sendResponse(result);
      return true;
    }

    return false;
  });
}

function analyzePage(): PageAnalysis {
  const fields = collectFieldCandidates();
  const pageText = collectImportantPageText();
  const title = normalizeText(document.title);
  const headline = getFirstText("h1") || getFirstText("h2");

  return {
    url: location.href,
    title,
    headline,
    pageSummary: pageText.slice(0, 1600),
    companySuggestion: buildCompanySuggestion(title, headline, pageText, fields),
    fields,
  };
}

function collectFieldCandidates(): PageFieldCandidate[] {
  const elements = Array.from(
    document.querySelectorAll('textarea, input, [contenteditable="true"], [contenteditable=""]'),
  )
    .map((element) => getSupportedTarget(element))
    .filter((element): element is HTMLElement => Boolean(element))
    .filter((element, index, self) => self.indexOf(element) === index)
    .filter(isVisibleField);

  return elements.slice(0, MAX_FIELDS).map((element) => {
    const rawContextCandidates = getRawFieldTextCandidates(element);
    const contextCandidates = uniqueTexts(rawContextCandidates.map(cleanCandidateText).filter(Boolean));
    const label = pickBestFieldLabel(contextCandidates);
    const placeholder = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.placeholder : "";
    const name = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.name : "";
    const value = getFieldValue(element);
    const contextText = [label, placeholder, name, ...contextCandidates, ...rawContextCandidates].join(" ");
    const maxLength = getUsefulMaxLength(element);
    const targetLength = extractTargetLength(contextText, maxLength);

    return {
      fieldId: ensureFieldId(element),
      label,
      placeholder,
      name,
      value,
      tagName: element.tagName.toLowerCase(),
      inputType: element instanceof HTMLInputElement ? element.type : element.tagName.toLowerCase(),
      required: element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.required : false,
      maxLength,
      targetLength,
      category: classifyField(contextText),
    };
  });
}

function insertText(text: string, fieldId?: string): { success: true } | { success: false; error: string } {
  if (fieldId) {
    currentTarget = getSupportedTarget(findFieldById(fieldId));
  }

  if (!currentTarget || !document.contains(currentTarget)) {
    return { success: false, error: "入力したい欄が見つかりませんでした。ページを解析し直してください。" };
  }

  currentTarget = getSupportedTarget(currentTarget);

  if (!currentTarget) {
    return { success: false, error: "選択された要素には挿入できません。" };
  }

  currentTarget.focus();

  if (isTextInput(currentTarget) || currentTarget instanceof HTMLTextAreaElement) {
    setNativeValue(currentTarget, text);
    currentTarget.dispatchEvent(new Event("input", { bubbles: true }));
    currentTarget.dispatchEvent(new Event("change", { bubbles: true }));
    return { success: true };
  }

  if (currentTarget.isContentEditable) {
    currentTarget.innerText = text;
    currentTarget.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    currentTarget.dispatchEvent(new Event("change", { bubbles: true }));
    return { success: true };
  }

  return { success: false, error: "挿入できる入力欄が見つかりませんでした。" };
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }
}

function ensureFieldId(element: HTMLElement): string {
  const existing = element.getAttribute(FIELD_ID_ATTRIBUTE);
  if (existing) {
    return existing;
  }

  const fieldId = `field-${Date.now().toString(36)}-${nextFieldIndex}`;
  nextFieldIndex += 1;
  element.setAttribute(FIELD_ID_ATTRIBUTE, fieldId);
  return fieldId;
}

function findFieldById(fieldId: string): Element | null {
  const escapedFieldId = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(fieldId) : fieldId.replace(/"/g, '\\"');
  return document.querySelector(`[${FIELD_ID_ATTRIBUTE}="${escapedFieldId}"]`);
}

function isVisibleField(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getRawFieldTextCandidates(element: HTMLElement): string[] {
  const candidates: string[] = [];

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    candidates.push(...Array.from(element.labels ?? []).map((label) => getElementText(label)));

    if (element.id) {
      const explicitLabel = document.querySelector<HTMLLabelElement>(`label[for="${cssAttributeValue(element.id)}"]`);
      if (explicitLabel) {
        candidates.push(getElementText(explicitLabel));
      }
    }
  }

  const closestLabel = element.closest("label");
  if (closestLabel instanceof HTMLLabelElement) {
    candidates.push(getElementText(closestLabel));
  }

  const fieldset = element.closest("fieldset");
  const legend = fieldset?.querySelector("legend");
  if (legend) {
    candidates.push(getElementText(legend));
  }

  candidates.push(
    element.getAttribute("aria-label") ?? "",
    element.getAttribute("data-label") ?? "",
    ...getPreviousContextTexts(element),
    ...getAncestorContextTexts(element),
  );

  return uniqueTexts(candidates.map(normalizeText).filter(Boolean));
}

function getPreviousContextTexts(element: HTMLElement): string[] {
  const texts: string[] = [];
  let current: Element | null = element;

  for (let depth = 0; current && current !== document.body && depth < 7; depth += 1) {
    let sibling = current.previousElementSibling;
    let siblingCount = 0;

    while (sibling && siblingCount < 6) {
      if (sibling instanceof HTMLElement && isVisibleContextElement(sibling)) {
        const text = getElementText(sibling);
        if (text) {
          texts.push(text);
        }
      }
      sibling = sibling.previousElementSibling;
      siblingCount += 1;
    }

    current = current.parentElement;
  }

  return texts;
}

function getAncestorContextTexts(element: HTMLElement): string[] {
  const texts: string[] = [];
  let current = element.parentElement;

  for (let depth = 0; current && current !== document.body && depth < 7; depth += 1) {
    if (isVisibleContextElement(current)) {
      const text = getElementText(current);
      if (text) {
        texts.push(text);
      }
    }
    current = current.parentElement;
  }

  return texts;
}

function pickBestFieldLabel(candidates: string[]): string {
  const ranked = candidates
    .map((text) => ({ text: trimLabel(text), score: scoreLabelCandidate(text) }))
    .filter((candidate) => candidate.text && candidate.score > -50)
    .sort((a, b) => b.score - a.score || a.text.length - b.text.length);

  return ranked[0]?.text ?? "入力欄";
}

function scoreLabelCandidate(text: string): number {
  const cleaned = cleanCandidateText(text);
  if (!cleaned) {
    return -200;
  }

  let score = 0;

  if (isCounterLikeText(cleaned)) {
    score -= 180;
  }

  if (/(^|\s)(q|Q)[0-9０-９]+[.．、:]?/.test(cleaned) || /(設問|質問|問[0-9０-９]+)/.test(cleaned)) {
    score += 90;
  }

  if (/(記入|入力|述べ|説明|教えて|ください|お書き|ご記入)/.test(cleaned)) {
    score += 45;
  }

  if (/(志望|応募|入社|魅力|自己PR|自己ＰＲ|強み|長所|研究|学習|経験|インターン|職種|希望|ガクチカ)/i.test(cleaned)) {
    score += 35;
  }

  if (/※/.test(cleaned)) {
    score += 12;
  }

  if (cleaned.length >= 15 && cleaned.length <= 360) {
    score += 25;
  } else if (cleaned.length > 360 && cleaned.length <= 900) {
    score += 8;
  } else if (cleaned.length > 900) {
    score -= 60;
  }

  if (/現在の文字数/.test(cleaned)) {
    score -= 80;
  }

  if (/保存|戻る|次へ|確認|送信|キャンセル/.test(cleaned) && cleaned.length < 80) {
    score -= 30;
  }

  return score;
}

function cleanCandidateText(text: string): string {
  return normalizeText(text)
    .replace(/現在の文字数\s*[:：]?\s*[0-9０-９]+\s*\/\s*[0-9０-９]+\s*字/g, " ")
    .replace(/[0-9０-９]+\s*\/\s*[0-9０-９]+\s*字/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimLabel(text: string): string {
  const cleaned = cleanCandidateText(text);
  if (cleaned.length <= MAX_LABEL_LENGTH) {
    return cleaned;
  }

  const questionStart = cleaned.search(/(Q|q)[0-9０-９]+|設問|質問|問[0-9０-９]+|※|志望|自己PR|研究|経験/);
  const start = questionStart >= 0 ? questionStart : 0;
  const trimmed = cleaned.slice(start, start + MAX_LABEL_LENGTH);

  return trimmed.length < cleaned.length ? `${trimmed}...` : trimmed;
}

function isCounterLikeText(text: string): boolean {
  const cleaned = normalizeText(text);
  return (
    /^現在の文字数\s*[:：]?\s*[0-9０-９]+\s*\/\s*[0-9０-９]+\s*字$/.test(cleaned) ||
    /^[0-9０-９]+\s*\/\s*[0-9０-９]+\s*字$/.test(cleaned)
  );
}

function isVisibleContextElement(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getElementText(element: Element): string {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("textarea, input, select, button, script, style").forEach((child) => child.remove());
  return normalizeText(clone.innerText || clone.textContent || "");
}

function getFieldValue(element: HTMLElement): string {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return normalizeText(element.value).slice(0, 1200);
  }

  return normalizeText(element.innerText).slice(0, 1200);
}

function getUsefulMaxLength(element: HTMLElement): number | undefined {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    return undefined;
  }

  const maxLength = element.maxLength;
  if (maxLength > 0 && maxLength < 50000) {
    return maxLength;
  }

  return undefined;
}

function classifyField(text: string): PageFieldCategory {
  const normalized = normalizeText(text).toLowerCase();

  if (/(志望|応募理由|入社理由|魅力|why\s+(?:us|company|join)|motivation)/i.test(normalized)) {
    return "motivation";
  }

  if (/(自己pr|自己ｐｒ|自己ＰＲ|強み|長所|アピール|ガクチカ|self[-\s]?pr|strength)/i.test(normalized)) {
    return "selfPr";
  }

  if (/(研究|学習|学業|卒論|修論|テーマ|ai|機械学習|統計解析|データ|research|thesis)/i.test(normalized)) {
    return "research";
  }

  if (/(インターン|職務経験|業務経験|アルバイト|internship|work\s*experience)/i.test(normalized)) {
    return "internship";
  }

  return "other";
}

function extractTargetLength(text: string, maxLength?: number): number | undefined {
  if (maxLength) {
    return maxLength;
  }

  const normalized = toHalfWidthNumber(text);
  const slashMatch = normalized.match(/[0-9]+\s*\/\s*([0-9]{2,5})\s*字/);
  const lengthMatch = normalized.match(/([0-9]{2,5})\s*(?:字|文字|characters|chars)/i);
  const value = Number(slashMatch?.[1] ?? lengthMatch?.[1]);

  if (Number.isFinite(value) && value >= 50 && value <= 50000) {
    return value;
  }

  return undefined;
}

function collectImportantPageText(): string {
  const metaDescription =
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ??
    document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.content ??
    "";
  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .map((heading) => normalizeText(heading.textContent ?? ""))
    .filter(Boolean)
    .slice(0, 16)
    .join("\n");
  const bodyText = normalizeText(document.body?.innerText ?? "").slice(0, MAX_TEXT_LENGTH);

  return [metaDescription, headings, bodyText].map(normalizeText).filter(Boolean).join("\n\n");
}

function buildCompanySuggestion(
  title: string,
  headline: string,
  pageText: string,
  fields: PageFieldCandidate[],
): PageAnalysis["companySuggestion"] {
  const companyName = inferCompanyName(title, headline);
  const jobType = inferJobType([title, headline, pageText].join(" "));
  const targetLength = fields.find((field) => field.targetLength)?.targetLength;
  const questionSummary = fields
    .map((field) => {
      const length = field.targetLength ? ` (${field.targetLength}字目安)` : "";
      return `- ${field.label}${length}`;
    })
    .slice(0, 8)
    .join("\n");
  const business = extractSection(pageText, ["事業", "サービス", "business", "service"]) || pageText.slice(0, 500);
  const jobDescription =
    extractSection(pageText, ["募集", "職種", "仕事内容", "業務内容", "job", "position"]) ||
    [headline, questionSummary].filter(Boolean).join("\n");

  return {
    name: companyName,
    jobType,
    business,
    jobDescription: [jobDescription, questionSummary && `ページで見つかった設問:\n${questionSummary}`]
      .filter(Boolean)
      .join("\n\n"),
    targetLength,
  };
}

function inferCompanyName(title: string, headline: string): string {
  const siteName =
    document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content ??
    document.querySelector<HTMLMetaElement>('meta[name="application-name"]')?.content ??
    "";
  const candidates = [siteName, headline, ...title.split(/[|｜\-–—]/)]
    .map(normalizeText)
    .filter((text) => text.length >= 2 && text.length <= 40);
  const companyLike = candidates.find((text) => /(株式会社|有限会社|合同会社|Inc\.|LLC|Ltd\.|Co\.)/i.test(text));

  return companyLike ?? candidates[0] ?? "";
}

function inferJobType(text: string): string {
  const normalized = normalizeText(text);
  const match = normalized.match(
    /(総合職|エンジニア|ソフトウェアエンジニア|営業|企画|マーケティング|デザイナー|研究職|開発職|コンサルタント|データサイエンティスト|プロダクトマネージャー|事務職|技術職)/,
  );

  return match?.[1] ?? "";
}

function extractSection(text: string, keywords: string[]): string {
  const normalized = normalizeText(text);
  const lower = normalized.toLowerCase();
  const index = keywords
    .map((keyword) => lower.indexOf(keyword.toLowerCase()))
    .filter((position) => position >= 0)
    .sort((a, b) => a - b)[0];

  if (index === undefined) {
    return "";
  }

  const start = Math.max(0, index - 120);
  return normalized.slice(start, start + 700);
}

function getFirstText(selector: string): string {
  return normalizeText(document.querySelector(selector)?.textContent ?? "");
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function uniqueTexts(texts: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const text of texts) {
    const normalized = normalizeText(text);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function toHalfWidthNumber(text: string): string {
  return text.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));
}

function cssAttributeValue(value: string): string {
  return typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value.replace(/"/g, '\\"');
}
