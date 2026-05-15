type InsertMessage = {
  type: "INSERT_TEXT";
  text: string;
};

let currentTarget: HTMLElement | null = null;
const windowWithFlag = window as Window & { __esTailorContentScriptLoaded__?: boolean };

function isTextInput(element: Element): element is HTMLInputElement {
  return element instanceof HTMLInputElement && ["text", "search"].includes(element.type);
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

if (!windowWithFlag.__esTailorContentScriptLoaded__) {
  windowWithFlag.__esTailorContentScriptLoaded__ = true;

  currentTarget = getSupportedTarget(document.activeElement);

  document.addEventListener("focusin", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const supportedTarget = getSupportedTarget(target);
    if (supportedTarget) {
      currentTarget = supportedTarget;
    }
  });

  chrome.runtime.onMessage.addListener((message: InsertMessage, _sender, sendResponse) => {
    if (message.type !== "INSERT_TEXT") {
      return false;
    }

    const result = insertText(message.text);
    sendResponse(result);
    return true;
  });
}

function insertText(text: string): { success: true } | { success: false; error: string } {
  if (!currentTarget || !document.contains(currentTarget)) {
    return { success: false, error: "入力したい欄をクリックしてからもう一度試してください。" };
  }

  currentTarget = getSupportedTarget(currentTarget);

  if (!currentTarget) {
    return { success: false, error: "選択中の要素には挿入できません。" };
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

  return { success: false, error: "挿入できる入力欄が見つかりません。" };
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
