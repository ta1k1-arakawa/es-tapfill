# ES Tailor

就活エントリーシートの下書き作成とフォーム入力を支援する Chrome 拡張機能 MVP です。基本情報はブラウザ内の `chrome.storage.local` に保存し、AI 生成時だけバックエンドへ送信します。

## 機能一覧

- 基本情報の保存: 学歴、研究概要、自己PR、インターン経験、スキル、価値観、将来やりたいこと
- 企業情報の入力: 企業名、職種、事業内容、求人内容、魅力に感じた点、希望文字数
- AI またはモックによる 4 種類の文章生成
- 生成結果のコピー
- 現在クリックしている `input`、`textarea`、`contenteditable` への文章挿入
- Backend URL とモック生成モードの設定

## ディレクトリ構成

```text
es-tailor/
├── backend/
└── extension/
```

## backend セットアップ

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Windows PowerShell の場合:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --port 8000
```

## .env の設定

`.env.example` を `.env` にコピーして設定します。

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

`OPENAI_API_KEY` が空、またはリクエストの `mock_mode` が `true` の場合はモック文章を返します。`AI_PROVIDER=gemini` にすると Gemini API を使う設定に切り替えられます。

## extension セットアップ

```bash
cd extension
npm install
npm run build
```

Chrome で読み込む手順:

1. `chrome://extensions` を開く
2. デベロッパーモードを ON
3. 「パッケージ化されていない拡張機能を読み込む」を選択
4. `extension/dist` を指定
5. 拡張機能アイコンを押して右サイドパネルを開く

## 使い方

1. backend を `http://localhost:8000` で起動
2. extension をビルドして Chrome に読み込む
3. サイドパネルの「基本情報」で情報を保存
4. 「企業情報」で企業情報を入力して「AIで提案を作成」を押す
5. 「生成結果」でコピー、または入力したい Web ページの欄をクリックしてから「選択中の欄に挿入」を押す

## モック生成モード

設定タブで「モック生成モード」を ON にすると、API キーなしで文章生成の動作確認ができます。モック文章は入力された基本情報と企業情報をもとに作成されます。

## プライバシー方針

- 名前、住所、電話番号、メールアドレスは扱いません。
- 基本情報は `chrome.storage.local` に保存します。
- MVP ではログイン機能とクラウド保存は作りません。
- AI 生成時のみ、ユーザーが入力した基本情報と企業情報を backend に送信します。
- 送信ボタンは自動で押しません。フォームへの文章挿入だけを行います。
- AI 生成文は下書きです。提出前に必ず内容を確認してください。

## 今後の拡張予定

- 企業ごとの生成履歴
- 文字数別テンプレート
- 生成結果の比較と改善提案
- 入力欄候補のハイライト
- ローカルのみでの履歴エクスポート
