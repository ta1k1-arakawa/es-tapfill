# ES Tailor Backend

FastAPI で動く ES Tailor の AI 生成 API です。`POST /generate/all` で、基本情報と企業情報から志望動機、自己 PR、研究概要、インターン経験の下書きを返します。

## セットアップ

`backend/` 内で作業する場合:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

リポジトリルートから起動する場合:

```powershell
.\backend\.venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000
```

## .env

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

API キーが未設定の場合はモック文面を返します。Gemini を使う場合は `AI_PROVIDER=gemini` と `GEMINI_API_KEY` を設定してください。

## API

```http
GET /health
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
