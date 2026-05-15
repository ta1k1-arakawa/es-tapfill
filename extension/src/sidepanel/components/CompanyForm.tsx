import { Sparkles } from "lucide-react";
import type { Company } from "../../lib/types";

type Props = {
  company: Company;
  isGenerating: boolean;
  onChange: (company: Company) => void;
  onGenerate: (company: Company) => Promise<void>;
};

export default function CompanyForm({ company, isGenerating, onChange, onGenerate }: Props) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>企業情報</h2>
        <p>求人票や企業ページを見ながら使う項目です。</p>
      </div>

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
          <span>求人内容</span>
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
            max={1200}
            step={50}
            type="number"
            value={company.targetLength}
            onChange={(event) => onChange({ ...company, targetLength: Number(event.target.value) })}
          />
        </label>

        <button className="primary-button" disabled={isGenerating} type="submit">
          <Sparkles size={16} aria-hidden="true" />
          {isGenerating ? "生成中..." : "AI で下書き作成"}
        </button>
      </form>
    </section>
  );
}
