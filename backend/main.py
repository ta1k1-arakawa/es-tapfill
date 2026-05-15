from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from .ai_client import AIClientError, generate_all_texts
    from .schemas import GeneratedResponse, GenerateAllRequest
except ImportError:
    from ai_client import AIClientError, generate_all_texts
    from schemas import GeneratedResponse, GenerateAllRequest


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI(title="ES Tailor API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate/all", response_model=GeneratedResponse)
def generate_all(request: GenerateAllRequest) -> GeneratedResponse:
    try:
        return generate_all_texts(request)
    except AIClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"生成リクエストの処理に失敗しました: {exc}") from exc
