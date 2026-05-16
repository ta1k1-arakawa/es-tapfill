import json

try:
    from .schemas import GenerateAllRequest
except ImportError:
    from schemas import GenerateAllRequest


SYSTEM_PROMPT = """あなたは就活エントリーシートの下書き作成を支援するアシスタントです。
ユーザーの基本情報、企業情報、ページから取得した設問情報をもとに、企業に合わせたES下書きを日本語で作成してください。

条件:
- ユーザーが書いていない経験を捏造しない
- 企業情報にない事業や特徴を断定しない
- 研究、自己PR、インターン経験、価値観のいずれかと企業の特徴を自然につなげる
- 「成長したい」「理念に共感した」だけで終わらせない
- 学生らしい自然な文体にする
- 各文章は指定文字数を大きく超えないようにする
- 提出前にユーザーが確認する前提の下書きにする
- 出力はJSONのみ

出力JSONのキー:
- motivation
- self_pr
- research
- internship
"""


def build_user_prompt(request: GenerateAllRequest) -> str:
    payload = {
        "profile": request.profile.model_dump(),
        "company": request.company.model_dump(),
        "output_format": {
            "motivation": "志望動機",
            "self_pr": "企業向けに調整した自己PR",
            "research": "企業向けに調整した研究概要",
            "internship": "企業向けに調整したインターン経験",
        },
    }

    return (
        "以下のJSONを入力情報として扱い、条件を守ってES下書きを作成してください。\n"
        "未入力の項目がある場合は無理に補完せず、書かれている情報だけで自然に作成してください。\n"
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )
