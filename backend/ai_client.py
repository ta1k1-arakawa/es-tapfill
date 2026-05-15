import json
import os
from typing import Any

try:
    from .prompts import SYSTEM_PROMPT, build_user_prompt
    from .schemas import GeneratedResponse, GenerateAllRequest
except ImportError:
    from prompts import SYSTEM_PROMPT, build_user_prompt
    from schemas import GeneratedResponse, GenerateAllRequest


class AIClientError(Exception):
    pass


def generate_all_texts(request: GenerateAllRequest) -> GeneratedResponse:
    provider = os.getenv("AI_PROVIDER", "openai").lower()

    if request.mock_mode or provider == "mock":
        return build_mock_response(request)

    if provider == "gemini":
        if not os.getenv("GEMINI_API_KEY"):
            return build_mock_response(request)
        return generate_with_gemini(request)

    if not os.getenv("OPENAI_API_KEY"):
        return build_mock_response(request)

    return generate_with_openai(request)


def generate_with_openai(request: GenerateAllRequest) -> GeneratedResponse:
    try:
        from openai import OpenAI

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_prompt(request)},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
        )
        content = completion.choices[0].message.content
        return parse_generated_response(content)
    except AIClientError:
        raise
    except Exception as exc:
        raise AIClientError(f"OpenAI API での生成に失敗しました: {exc}") from exc


def generate_with_gemini(request: GenerateAllRequest) -> GeneratedResponse:
    try:
        import google.generativeai as genai

        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        response = model.generate_content(
            [SYSTEM_PROMPT, build_user_prompt(request)],
            generation_config={"response_mime_type": "application/json", "temperature": 0.4},
        )
        return parse_generated_response(response.text)
    except AIClientError:
        raise
    except Exception as exc:
        raise AIClientError(f"Gemini API での生成に失敗しました: {exc}") from exc


def parse_generated_response(content: str | None) -> GeneratedResponse:
    if not content:
        raise AIClientError("AI から空の応答が返されました。")

    try:
        data: dict[str, Any] = json.loads(strip_code_fence(content))
        return GeneratedResponse.model_validate(data)
    except Exception as exc:
        raise AIClientError("AI の応答を JSON として解釈できませんでした。もう一度生成してください。") from exc


def strip_code_fence(content: str) -> str:
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return text


def build_mock_response(request: GenerateAllRequest) -> GeneratedResponse:
    profile = request.profile
    company = request.company
    company_name = company.name or "入力された企業"
    job_type = company.job_type or "希望職種"
    attractive = company.attractive_point or "魅力に感じた点"
    business = company.business or "事業内容"
    job_description = company.job_description or "求人内容"
    target = company.target_length

    motivation = (
        f"私が{company_name}の{job_type}を志望する理由は、{business}に取り組む中で、"
        f"自分の経験や価値観を生かせると感じたためです。特に{attractive}に強く惹かれています。"
        "これまでの研究や学びで培った課題を整理し、周囲と協力しながら形にしていく姿勢を生かし、"
        "貴社で価値を生み出したいです。"
    )
    self_pr = (
        f"私の強みは、{profile.self_pr or '目標に向けて粘り強く取り組めること'}です。"
        f"{company_name}の{job_type}においても、{profile.values or '相手の立場を考える姿勢'}を大切にし、"
        "状況を丁寧に整理しながら着実に行動したいと考えています。"
    )
    research = (
        f"私の研究概要は、{profile.research or '現在入力されている研究内容'}です。"
        f"研究で意識してきた仮説検証や情報整理の姿勢は、{company_name}の{job_description}においても、"
        "業務理解や課題解決に生かせると考えています。"
    )
    internship = (
        f"インターン経験では、{profile.internship or '入力された経験'}を通じて、"
        "実務で求められる連携や改善の重要性を学びました。"
        f"この経験を、{company_name}で求められる{job_type}の仕事に向き合う際にも生かしたいです。"
    )

    return GeneratedResponse(
        motivation=trim_to_length(motivation, target),
        self_pr=trim_to_length(self_pr, target),
        research=trim_to_length(research, target),
        internship=trim_to_length(internship, target),
    )


def trim_to_length(text: str, target_length: int) -> str:
    limit = max(target_length + 60, 160)
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"
