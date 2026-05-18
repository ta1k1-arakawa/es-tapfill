# ES TapFill

ES TapFill は、就活エントリーシートの下書き作成とフォームへの挿入を支援する Chrome 拡張機能です。  
基本情報はブラウザの `chrome.storage.local` に保存し、AI 生成時だけ backend に送信します。

## ディレクトリ構成

```text
es-TapFill/
├─ backend/    # FastAPI backend
└─ extension/  # Chrome extension
```

## Backend

ルートディレクトリから起動する場合:

```powershell
python -m venv backend\.venv
.\backend\.venv\Scripts\python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
.\backend\.venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000
```

`backend/` に移動して起動する場合:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

`.env` の例:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-nano
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

`OPENAI_API_KEY` が空、または拡張機能の Mock 生成モードが ON の場合は、API を呼ばずにモック文面を返します。`AI_PROVIDER=gemini` にすると Gemini API を使用します。

## Extension

```powershell
cd extension
npm.cmd install
npm.cmd run build
```

Chrome で読み込む手順:

1. `chrome://extensions` を開く
2. デベロッパーモードを ON
3. 「パッケージ化されていない拡張機能を読み込む」を選択
4. `extension/dist` を指定

## 使い方

1. backend を `http://localhost:8000` で起動
2. extension をビルドして Chrome に読み込む
3. サイドパネルで基本情報を保存
4. 企業情報を入力して下書きを生成
5. 生成結果をコピー、または入力欄をクリックしてから挿入

## API

```http
GET /health
POST /generate/all
```
