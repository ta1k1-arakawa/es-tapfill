import type { GeneratedTexts, Profile, Settings } from "./types";

export const STORAGE_KEYS = {
  profile: "esTailorProfile",
  settings: "esTailorSettings",
  lastGenerated: "esTailorLastGenerated",
} as const;

export const defaultProfile: Profile = {
  education: "",
  research: "",
  selfPr: "",
  internship: "",
  skills: "",
  values: "",
  careerGoal: "",
};

export const defaultSettings: Settings = {
  backendUrl: "http://localhost:8000",
  mockMode: false,
};

export const defaultGeneratedTexts: GeneratedTexts = {
  motivation: "",
  selfPr: "",
  research: "",
  internship: "",
};

function getLocal<T>(key: string, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (items) => {
      resolve({ ...fallback, ...(items[key] ?? {}) });
    });
  });
}

function setLocal<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

export function loadProfile(): Promise<Profile> {
  return getLocal(STORAGE_KEYS.profile, defaultProfile);
}

export function saveProfile(profile: Profile): Promise<void> {
  return setLocal(STORAGE_KEYS.profile, profile);
}

export function loadSettings(): Promise<Settings> {
  return getLocal(STORAGE_KEYS.settings, defaultSettings);
}

export function saveSettings(settings: Settings): Promise<void> {
  return setLocal(STORAGE_KEYS.settings, settings);
}

export function loadLastGenerated(): Promise<GeneratedTexts> {
  return getLocal(STORAGE_KEYS.lastGenerated, defaultGeneratedTexts);
}

export function saveLastGenerated(generated: GeneratedTexts): Promise<void> {
  return setLocal(STORAGE_KEYS.lastGenerated, generated);
}
