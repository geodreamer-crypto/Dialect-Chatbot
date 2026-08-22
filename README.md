# Jemini 사투리 봇 (LangChain Multi-Vendor Dialect Chatbot)

표준어 문장과 사진(멀티모달)을 입력받아 구수한 전국 사투리로 번역하고, 상황에 맞는 맞춤형 후속 질문 추천 및 생생한 음성(TTS)을 제공하는 풀스택 AI 웹 어플리케이션입니다.

---

## 🌟 주요 기능

- 🗺️ **5개 지역 사투리 번역**: 경상도, 전라도, 강원도, 제주도, 북한 사투리 완벽 지원
- 🤖 **LangChain 기반 다중 LLM 벤더 지원 (실시간 모델 전환)**:
  - **Google Gemini**: `gemini-3.6-flash` (기본 권장), `gemini-1.5-pro`
  - **OpenAI**: `gpt-4o-mini`, `gpt-4o`
  - **Anthropic**: `claude-3-5-sonnet-20241022`
  - **Ollama**: `llama3.2` (로컬 온디바이스 모델)
  - 화면 상단 `ModelSelector`를 통해 실시간으로 LLM 벤더와 모델을 선택 및 전환 가능
- 💡 **사투리 봇 특화 후속 추천 질문 자동 제안**:
  - LLM Structured Output을 통해 답변 본문과 함께 3가지 맞춤형 후속 질문(타 지역 비교, 억양/발음 팁, 어원/유래, 실생활 표현)을 자동 생성
  - 추천 질문 버튼 클릭 시 즉시 후속 대화 이어가기 지원
- 🖼️ **멀티모달 이미지 분석 & 번역**:
  - 음식, 사물, 풍경 사진을 업로드하면 상황과 이미지를 인식하여 사투리로 생생하게 의역/설명
- 🎙️ **음성 입력(STT) & 사투리 음성 출력(TTS)**:
  - Web Speech API 기반 표준어 마이크 음성 입력
  - 번역된 사투리 메시지 오디오 음성(TTS) 듣기 지원
- 💾 **Supabase 실시간 대화 기록 관리**:
  - 대화방 생성 및 메시지 이력 DB 자동 저장/불러오기
  - 첫 대화 내용 기반 채팅방 제목 자동 설정

---

## 🏗️ 아키텍처 및 디렉토리 구조

프론트엔드와 백엔드를 완전히 분리하였으며, 각각 **FSD(Feature-Sliced Design)** 및 **클린 아키텍처(Clean Architecture)** 패턴을 엄격히 준수합니다.

### 1. 프론트엔드 (`frontend/` - FSD 아키텍처)
```text
frontend/
 ├── src/
 │    ├── app/                    # 글로벌 스타일(index.css), 전역 프로바이더
 │    ├── pages/                  # MainPage (전체 화면 레이아웃 조립)
 │    ├── widgets/                # Sidebar, ChatWindow (독립적 UI 블록)
 │    ├── features/               # 사용자와 상호작용하는 구체적 기능 모듈
 │    │    ├── model-selector/    # LLM 벤더/모델 실시간 선택 드롭다운 UI & 상수
 │    │    ├── suggested-questions/# 봇 추천 질문 칩 목록 및 원클릭 전송
 │    │    ├── chat-input/        # 텍스트, 이미지 첨부, 음성인식(STT) 입력창
 │    │    ├── play-tts/          # 사투리 음성 합성(TTS) 재생 버튼
 │    │    └── create-chat/       # 새 대화방 생성
 │    ├── entities/               # 비즈니스 도메인 데이터 모델 및 UI (Chat, Message)
 │    └── shared/                 # 공통 API 설정(config.js), 재사용 컴포넌트, 유틸
 ├── package.json
 └── vite.config.js
```

### 2. 백엔드 (`backend/` - 클린 아키텍처 & TDD)
```text
backend/
 ├── app/
 │    ├── domain/                 # Pydantic DTO 및 스키마 (TranslationResponse, ChatRequest 등)
 │    ├── application/            # 순수 비즈니스 로직 Use Cases 및 인터페이스 명세(ILLMService)
 │    ├── infrastructure/         # LangChain 다중 벤더 서비스, Supabase Repository 구현체
 │    │    ├── langchain_service.py # init_chat_model, Structured Output, 멀티모달 처리
 │    │    └── supabase_repo.py     # Supabase DB 연동 구현체
 │    └── presentation/           # FastAPI 라우터 및 엔드포인트 (/api/chat, /api/history 등)
 ├── tests/
 │    └── unit/                   # Mock 객체를 활용한 비즈니스 로직 및 LangChain 단위 테스트
 ├── main.py                      # FastAPI 인스턴스 초기화 및 의존성 주입(DI) 조립
 ├── requirements.txt
 └── .env                         # 환경 변수 (API 키 및 기본 모델 설정)
```

---

## ⚙️ 환경 변수 설정 (`backend/.env`)

`backend/` 디렉토리에 `.env` 파일을 생성하고 필요한 환경 변수를 설정합니다.

```env
# Supabase 설정 (필수)
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# LLM 기본 제공자 및 모델 설정 (선택 사항 - 미지정 시 기본값 적용)
DEFAULT_LLM_PROVIDER=google_genai
DEFAULT_LLM_MODEL=gemini-3.6-flash

# API 키 설정 (사용할 벤더의 키를 입력)
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key          # OpenAI 모델 사용 시
ANTHROPIC_API_KEY=your-anthropic-api-key    # Claude 모델 사용 시
OLLAMA_BASE_URL=http://localhost:11434      # Ollama 로컬 구동 시
```

> **💡 안내**: API 키가 등록되지 않은 벤더나 모델을 선택하더라도 서비스가 중단되지 않고 친절한 안내와 함께 **모의 응답(Mock Mode)**으로 안전하게 동작합니다.

---

## 🚀 실행 및 테스트 방법

### 1. 백엔드 실행 (FastAPI)
```bash
cd backend

# 1) 가상환경 패키지 설치
pip install -r requirements.txt

# 2) 단위 테스트 (TDD) 실행 (전체 7개 테스트 통과 확인)
python -m pytest tests/unit

# 3) FastAPI 개발 서버 실행
uvicorn main:app --reload --port 8000
```
- **서버 주소**: `http://localhost:8000`
- **Swagger API 문서**: `http://localhost:8000/docs`

### 2. 프론트엔드 실행 (React / Vite)
새 터미널을 열고 다음 명령어를 실행합니다.
```bash
cd frontend

# 1) 패키지 설치
npm install

# 2) Linter 검사 및 프로덕션 빌드 검증
npx oxlint
npm run build

# 3) Vite 개발 서버 실행
npm run dev
```
- **웹 앱 접속 주소**: `http://localhost:5173`

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 스택 |
| :--- | :--- |
| **Frontend** | React 19, Vite, Vanilla CSS (Glassmorphism Dark Theme), Lucide-React, React-Markdown |
| **Architecture** | Feature-Sliced Design (FSD, 프론트엔드) / Clean Architecture (백엔드) |
| **Backend** | Python 3.14+, FastAPI, Pydantic v2, Uvicorn |
| **LLM & AI** | LangChain Core & Community, `langchain-google-genai`, `langchain-openai`, `langchain-anthropic` |
| **Database** | Supabase (PostgreSQL) |
| **Testing** | Pytest, Pytest-Asyncio, Oxlint |
