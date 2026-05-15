import { useEffect, useMemo, useState } from "react";
import { generateAll } from "../lib/api";
import {
  defaultGeneratedTexts,
  defaultProfile,
  defaultSettings,
  loadLastGenerated,
  loadProfile,
  loadSettings,
  saveLastGenerated,
  saveProfile,
  saveSettings,
} from "../lib/storage";
import type { Company, GeneratedTexts, InsertResponse, Profile, Settings } from "../lib/types";
import CompanyForm from "./components/CompanyForm";
import GeneratedTextsView from "./components/GeneratedTexts";
import ProfileForm from "./components/ProfileForm";
import SettingsView from "./components/Settings";

type TabKey = "profile" | "company" | "results" | "settings";

const defaultCompany: Company = {
  name: "",
  jobType: "",
  business: "",
  jobDescription: "",
  attractivePoint: "",
  targetLength: 400,
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "profile", label: "基本" },
  { key: "company", label: "企業" },
  { key: "results", label: "生成" },
  { key: "settings", label: "設定" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [company, setCompany] = useState<Company>(defaultCompany);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [generatedTexts, setGeneratedTexts] = useState<GeneratedTexts>(defaultGeneratedTexts);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([loadProfile(), loadSettings(), loadLastGenerated()]).then(([savedProfile, savedSettings, savedGenerated]) => {
      setProfile(savedProfile);
      setSettings(savedSettings);
      setGeneratedTexts(savedGenerated);
    });
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const hasGenerated = useMemo(
    () => Object.values(generatedTexts).some((text) => text.trim().length > 0),
    [generatedTexts],
  );

  async function handleSaveProfile(nextProfile: Profile) {
    setError("");
    await saveProfile(nextProfile);
    setProfile(nextProfile);
    setNotice("基本情報を保存しました。");
  }

  async function handleSaveSettings(nextSettings: Settings) {
    setError("");
    await saveSettings(nextSettings);
    setSettings(nextSettings);
    setNotice("設定を保存しました。");
  }

  async function handleGenerate(nextCompany: Company) {
    setError("");
    setNotice("");
    setIsGenerating(true);
    const normalizedCompany = {
      ...nextCompany,
      targetLength: Math.min(1200, Math.max(100, nextCompany.targetLength || 400)),
    };
    setCompany(normalizedCompany);

    try {
      const generated = await generateAll(settings.backendUrl, profile, normalizedCompany, settings.mockMode);
      await saveLastGenerated(generated);
      setGeneratedTexts(generated);
      setActiveTab("results");
      setNotice("生成しました。");
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : "AI 生成に失敗しました。";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleInsert(text: string) {
    setError("");
    setNotice("");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setError("挿入先のタブが見つかりません。");
      return;
    }

    try {
      const response = await sendInsertMessage(tab.id, text);
      handleInsertResponse(response);
    } catch {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["assets/contentScript.js"],
        });
        const response = await sendInsertMessage(tab.id, text);
        handleInsertResponse(response);
      } catch {
        setError("入力したい欄をクリックしてからもう一度試してください。Chrome 内部ページには挿入できません。");
      }
    }
  }

  async function sendInsertMessage(tabId: number, text: string): Promise<InsertResponse> {
    return (await chrome.tabs.sendMessage(tabId, {
      type: "INSERT_TEXT",
      text,
    })) as InsertResponse;
  }

  function handleInsertResponse(response: InsertResponse) {
    if (response.success) {
      setNotice("選択中の欄に挿入しました。");
    } else {
      setError(response.error ?? "挿入できませんでした。");
    }
  }

  async function handleCopy(text: string) {
    setError("");
    await navigator.clipboard.writeText(text);
    setNotice("コピーしました。");
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">ES Tailor</p>
          <h1>ES 下書き作成</h1>
        </div>
        {settings.mockMode && <span className="mock-badge">Mock</span>}
      </header>

      <nav className="tabs" aria-label="ES Tailor tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "tab active" : "tab"}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {notice && <div className="message success">{notice}</div>}
      {error && <div className="message error">{error}</div>}

      {activeTab === "profile" && <ProfileForm profile={profile} onSave={handleSaveProfile} />}
      {activeTab === "company" && (
        <CompanyForm company={company} isGenerating={isGenerating} onChange={setCompany} onGenerate={handleGenerate} />
      )}
      {activeTab === "results" && (
        <GeneratedTextsView
          generatedTexts={generatedTexts}
          hasGenerated={hasGenerated}
          onCopy={handleCopy}
          onInsert={handleInsert}
        />
      )}
      {activeTab === "settings" && <SettingsView settings={settings} onSave={handleSaveSettings} />}
    </main>
  );
}
