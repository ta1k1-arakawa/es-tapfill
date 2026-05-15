# ES Tailor Backend

FastAPI で動く ES Tailor の AI 生成 API です。`POST /generate/all` で、基本情報と企業情報から志望動機、自己PR、研究概要、インターン経験の下書きを返します。

## セットアップ

macOS / Linux:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --port 8000
```

## .env

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

`OPENAI_API_KEY` が未設定、またはリクエストの `mock_mode` が `true` の場合はモック文章を返します。`AI_PROVIDER=gemini` にすると Gemini API を使えます。

## API

```http
POST /generate/all
```

```json
{
  "profile": {
    "education": "...",
    "research": "...",
    "self_pr": "...",
    "internship": "...",
    "skills": "...",
    "values": "...",
    "career_goal": "..."
  },
  "company": {
    "name": "...",
    "job_type": "...",
    "business": "...",
    "job_description": "...",
    "attractive_point": "...",
    "target_length": 400
  },
  "mock_mode": false
}
```

## プライバシー方針

- 名前、住所、電話番号、メールアドレスは扱いません。
- MVP ではログイン機能とクラウド保存は作りません。
- AI 生成時のみ、ユーザーが入力した基本情報と企業情報を受け取ります。
- AI 生成文は下書きです。提出前に必ず内容を確認してください。

## 今後の拡張予定

- 生成履歴 API
- 文字数ごとの再生成 API
- 企業情報の取り込み支援
- ローカル評価用テストデータ
