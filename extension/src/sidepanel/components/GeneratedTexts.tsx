import { Clipboard, FileInput } from "lucide-react";
import type { GeneratedTextKey, GeneratedTexts, PageFieldCandidate } from "../../lib/types";

type Props = {
  generatedTexts: GeneratedTexts;
  hasGenerated: boolean;
  pageFields: PageFieldCandidate[];
  onCopy: (text: string) => Promise<void>;
  onInsert: (text: string, fieldId?: string) => Promise<void>;
};

const resultItems: { key: GeneratedTextKey; label: string }[] = [
  { key: "motivation", label: "志望動機" },
  { key: "selfPr", label: "自己PR" },
  { key: "research", label: "研究概要" },
  { key: "internship", label: "インターン経験" },
];

export default function GeneratedTextsView({ generatedTexts, hasGenerated, pageFields, onCopy, onInsert }: Props) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>生成結果</h2>
        <p>コピーするか、ページ解析で見つけた入力候補へそのまま挿入できます。</p>
      </div>

      {!hasGenerated && <div className="empty-state">まだ生成結果がありません。</div>}

      <div className="result-list">
        {resultItems.map((item) => {
          const text = generatedTexts[item.key];
          const matchingFields = pageFields.filter((field) => field.category === item.key).slice(0, 4);

          return (
            <article className="result-card" key={item.key}>
              <div className="result-card-header">
                <h3>{item.label}</h3>
                <span>{text.length}字</span>
              </div>
              <p>{text || "未生成"}</p>
              <div className="button-row">
                <button className="secondary-button" disabled={!text} type="button" onClick={() => void onCopy(text)}>
                  <Clipboard size={15} aria-hidden="true" />
                  コピー
                </button>
                <button className="secondary-button" disabled={!text} type="button" onClick={() => void onInsert(text)}>
                  <FileInput size={15} aria-hidden="true" />
                  選択中の欄に挿入
                </button>
              </div>

              {matchingFields.length > 0 && (
                <div className="matched-targets">
                  <span>ページ候補へ挿入</span>
                  {matchingFields.map((field) => (
                    <button
                      className="target-button"
                      disabled={!text}
                      key={field.fieldId}
                      type="button"
                      title={field.label}
                      onClick={() => void onInsert(text, field.fieldId)}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
