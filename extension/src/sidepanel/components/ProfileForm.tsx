import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import type { Profile } from "../../lib/types";

type Props = {
  profile: Profile;
  onSave: (profile: Profile) => Promise<void>;
};

const fields: { key: keyof Profile; label: string; placeholder: string }[] = [
  { key: "education", label: "学歴", placeholder: "大学・学部・専攻、履修領域など" },
  { key: "research", label: "研究概要", placeholder: "研究テーマ、目的、工夫した点など" },
  { key: "selfPr", label: "自己PRの元文章", placeholder: "強み、具体的な経験、成果など" },
  { key: "internship", label: "インターン経験", placeholder: "参加企業、役割、学びなど" },
  { key: "skills", label: "スキル", placeholder: "技術、語学、資格、ツールなど" },
  { key: "values", label: "価値観", placeholder: "大切にしている考え方、働き方の軸など" },
  { key: "careerGoal", label: "将来やりたいこと", placeholder: "将来挑戦したい領域やありたい姿など" },
];

export default function ProfileForm({ profile, onSave }: Props) {
  const [draft, setDraft] = useState<Profile>(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>基本情報</h2>
        <p>名前や連絡先は入力しないでください。</p>
      </div>

      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(draft);
        }}
      >
        {fields.map((field) => (
          <label className="field" key={field.key}>
            <span>{field.label}</span>
            <textarea
              value={draft[field.key]}
              placeholder={field.placeholder}
              onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
            />
          </label>
        ))}

        <button className="primary-button" type="submit">
          <Save size={16} aria-hidden="true" />
          保存
        </button>
      </form>
    </section>
  );
}
