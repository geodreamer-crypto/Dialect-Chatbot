import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
from app.presentation.routers.api import router, get_chat_repo, get_message_repo, get_llm_service
from app.infrastructure.supabase_repo import SupabaseChatRepository, SupabaseMessageRepository
from app.infrastructure.gemini_api import GeminiService

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. 인프라 클라이언트 초기화
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 2. 구현체 초기화
chat_repo = SupabaseChatRepository(supabase)
msg_repo = SupabaseMessageRepository(supabase)
llm_service = GeminiService(GEMINI_API_KEY)

# 3. FastAPI Dependency Injection 재정의 (의존성 조립)
app.dependency_overrides[get_chat_repo] = lambda: chat_repo
app.dependency_overrides[get_message_repo] = lambda: msg_repo
app.dependency_overrides[get_llm_service] = lambda: llm_service

# 4. 라우터 연결
app.include_router(router)

@app.get("/")
def root():
    return {"message": "Hello from Clean Architecture FastAPI"}
