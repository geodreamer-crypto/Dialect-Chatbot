import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
from app.presentation.routers.api import router, get_chat_repo, get_message_repo, get_llm_service
from app.infrastructure.supabase_repo import SupabaseChatRepository, SupabaseMessageRepository
from app.infrastructure.langchain_service import LangChainService
from app.infrastructure.encryption_service import AES256GCMEncryptionService

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. 인프라 클라이언트 및 보안 서비스 초기화
import httpx
from supabase import ClientOptions

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
custom_httpx = httpx.Client(http2=False, timeout=30.0)
supabase: Client = create_client(
    SUPABASE_URL, 
    SUPABASE_KEY,
    options=ClientOptions(httpx_client=custom_httpx)
)

CHAT_ENCRYPTION_KEY = os.getenv("CHAT_ENCRYPTION_KEY", "default_secret_key_32_bytes_len!")
encryption_service = AES256GCMEncryptionService(CHAT_ENCRYPTION_KEY)

DEFAULT_LLM_PROVIDER = os.getenv("DEFAULT_LLM_PROVIDER", "google_genai")
DEFAULT_LLM_MODEL = os.getenv("DEFAULT_LLM_MODEL", "gemini-3.6-flash")

# 2. 구현체 초기화 (암호화 서비스 및 LangChain 기반 LLM 서비스 주입)
chat_repo = SupabaseChatRepository(supabase, encryption_service=encryption_service)
msg_repo = SupabaseMessageRepository(supabase, encryption_service=encryption_service)
llm_service = LangChainService(
    default_provider=DEFAULT_LLM_PROVIDER,
    default_model=DEFAULT_LLM_MODEL
)

# 3. FastAPI Dependency Injection 재정의 (의존성 조립)
app.dependency_overrides[get_chat_repo] = lambda: chat_repo
app.dependency_overrides[get_message_repo] = lambda: msg_repo
app.dependency_overrides[get_llm_service] = lambda: llm_service

# 4. 라우터 연결
app.include_router(router)

@app.get("/")
def root():
    return {"message": "Hello from Clean Architecture FastAPI"}
