import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import type { Settings } from "../../lib/types";

type Props = {
  settings: Settings;
  onSave: (settings: Settings) => Promise<void>;
};

export default function SettingsView({ settings, onSave }: Props) {
  const [draft, setDraft] = useState<Settings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>設定</h2>
        <p>Mock は API キーなしで動作確認するためのモードです。</p>
      </div>

      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(draft);
        }}
      >
        <label className="field">
          <span>Backend URL</span>
          <input
            value={draft.backendUrl}
            placeholder="http://localhost:8000"
            onChange={(event) => setDraft({ ...draft, backendUrl: event.target.value })}
          />
        </label>

        <label className="toggle-field">
          <input
            checked={draft.mockMode}
            type="checkbox"
            onChange={(event) => setDraft({ ...draft, mockMode: event.target.checked })}
          />
          <span>Mock 生成モード</span>
        </label>

        <button className="primary-button" type="submit">
          <Save size={16} aria-hidden="true" />
          保存
        </button>
      </form>
    </section>
  );
}
