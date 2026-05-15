import { Clipboard, FileInput } from "lucide-react";
import type { GeneratedTexts } from "../../lib/types";

type Props = {
  generatedTexts: GeneratedTexts;
  hasGenerated: boolean;
  onCopy: (text: string) => Promise<void>;
  onInsert: (text: string) => Promise<void>;
};

const resultItems: { key: keyof GeneratedTexts; label: string }[] = [
  { key: "motivation", label: "志望動機" },
  { key: "selfPr", label: "自己PR" },
  { key: "research", label: "研究概要" },
  { key: "internship", label: "インターン経験" },
];

export default function GeneratedTextsView({ generatedTexts, hasGenerated, onCopy, onInsert }: Props) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>生成結果</h2>
        <p>AI生成文は下書きです。提出前に必ず内容を確認してください。</p>
      </div>

      {!hasGenerated && <div className="empty-state">企業情報タブから文章を生成してください。</div>}

      <div className="result-list">
        {resultItems.map((item) => {
          const text = generatedTexts[item.key];
          return (
            <article className="result-card" key={item.key}>
              <div className="result-card-header">
                <h3>{item.label}</h3>
                <span>{text.length}字</span>
              </div>
              <p>{text || "まだ生成されていません。"}</p>
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
            </article>
          );
        })}
      </div>
    </section>
  );
}
