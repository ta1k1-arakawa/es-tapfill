import { Search, Sparkles } from "lucide-react";
import type { Company, PageAnalysis, PageFieldCandidate } from "../../lib/types";

type Props = {
  company: Company;
  isAnalyzingPage: boolean;
  isGenerating: boolean;
  pageAnalysis: PageAnalysis | null;
  onAnalyzePage: () => Promise<void>;
  onChange: (company: Company) => void;
  onGenerate: (company: Company) => Promise<void>;
};

const categoryLabels: Record<PageFieldCandidate["category"], string> = {
  motivation: "志望動機",
  selfPr: "自己PR",
  research: "研究",
  internship: "インターン",
  other: "その他",
};

export default function CompanyForm({
  company,
  isAnalyzingPage,
  isGenerating,
  pageAnalysis,
  onAnalyzePage,
  onChange,
  onGenerate,
}: Props) {
  function applyPageSuggestion() {
    if (!pageAnalysis) {
      return;
    }

    const suggestion = pageAnalysis.companySuggestion;
    onChange({
      name: fillIfEmpty(company.name, suggestion.name),
      jobType: fillIfEmpty(company.jobType, suggestion.jobType),
      business: fillIfEmpty(company.business, suggestion.business),
      jobDescription: fillIfEmpty(company.jobDescription, suggestion.jobDescription),
      attractivePoint: company.attractivePoint,
      targetLength: suggestion.targetLength ?? company.targetLength,
    });
  }

  function applyFieldCandidate(field: PageFieldCandidate) {
    const fieldContext = [
      `ページの設問: ${field.label}`,
      field.placeholder ? `プレースホルダー: ${field.placeholder}` : "",
      field.targetLength ? `文字数目安: ${field.targetLength}字` : "",
      field.value ? `既存入力: ${field.value}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    onChange({
      ...company,
      jobDescription: appendUniqueBlock(company.jobDescription, fieldContext),
      targetLength: field.targetLength ?? company.targetLength,
    });
  }

  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>企業情報</h2>
        <p>開いている採用ページやESフォームを読んで、生成に使えそうな情報を候補として取り込めます。</p>
      </div>

      <section className="page-scan-panel" aria-label="ページ解析">
        <div className="page-scan-header">
          <div>
            <h3>開いているページから候補を出す</h3>
            <p>入力欄をクリックしなくても、ページ内の設問や既存入力を探します。</p>
          </div>
          <button className="secondary-button" disabled={isAnalyzingPage} type="button" onClick={() => void onAnalyzePage()}>
            <Search size={15} aria-hidden="true" />
            {isAnalyzingPage ? "解析中..." : "ページ解析"}
          </button>
        </div>

        {pageAnalysis && (
          <div className="page-analysis">
            <div className="page-meta">
              <span>{pageAnalysis.title || pageAnalysis.url}</span>
              {pageAnalysis.headline && <strong>{pageAnalysis.headline}</strong>}
            </div>

            <button className="secondary-button full-width" type="button" onClick={applyPageSuggestion}>
              会社情報の空欄に反映
            </button>

            <div className="candidate-list">
              <div className="candidate-list-heading">
                <h3>見つかった入力候補</h3>
                <span>{pageAnalysis.fields.length}件</span>
              </div>

              {pageAnalysis.fields.length === 0 && (
                <div className="empty-state compact">このページでは入力欄を見つけられませんでした。</div>
              )}

              {pageAnalysis.fields.map((field) => (
                <article className="candidate-card" key={field.fieldId}>
                  <div className="candidate-card-header">
                    <h4>{field.label}</h4>
                    <span>{categoryLabels[field.category]}</span>
                  </div>
                  <p>
                    {field.targetLength ? `${field.targetLength}字目安` : "文字数指定なし"}
                    {field.required ? " / 必須" : ""}
                    {field.value ? ` / 入力済み: ${field.value.slice(0, 42)}` : ""}
                  </p>
                  <button className="secondary-button compact-button" type="button" onClick={() => applyFieldCandidate(field)}>
                    この設問を生成条件に入れる
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          void onGenerate(company);
        }}
      >
        <label className="field">
          <span>企業名</span>
          <input value={company.name} onChange={(event) => onChange({ ...company, name: event.target.value })} />
        </label>

        <label className="field">
          <span>職種</span>
          <input value={company.jobType} onChange={(event) => onChange({ ...company, jobType: event.target.value })} />
        </label>

        <label className="field">
          <span>事業内容</span>
          <textarea
            value={company.business}
            onChange={(event) => onChange({ ...company, business: event.target.value })}
          />
        </label>

        <label className="field">
          <span>求人内容・設問</span>
          <textarea
            value={company.jobDescription}
            onChange={(event) => onChange({ ...company, jobDescription: event.target.value })}
          />
        </label>

        <label className="field">
          <span>魅力に感じた点</span>
          <textarea
            value={company.attractivePoint}
            onChange={(event) => onChange({ ...company, attractivePoint: event.target.value })}
          />
        </label>

        <label className="field compact">
          <span>希望文字数</span>
          <input
            min={100}
            max={10000}
            step={100}
            type="number"
            value={company.targetLength}
            onChange={(event) => onChange({ ...company, targetLength: Number(event.target.value) })}
          />
        </label>

        <button className="primary-button" disabled={isGenerating} type="submit">
          <Sparkles size={16} aria-hidden="true" />
          {isGenerating ? "生成中..." : "AIで下書き作成"}
        </button>
      </form>
    </section>
  );
}

function fillIfEmpty(current: string, suggestion?: string): string {
  return current.trim() ? current : suggestion ?? current;
}

function appendUniqueBlock(current: string, block: string): string {
  if (!block || current.includes(block)) {
    return current;
  }

  return [current.trim(), block].filter(Boolean).join("\n\n");
}
