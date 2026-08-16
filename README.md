# Jemini 사투리 봇 프로젝트

이 프로젝트는 표준어를 구수한 지역 사투리로 번역해 주고, 이를 음성(TTS)으로 들려주는 웹 어플리케이션입니다.

## 🌟 주요 기능
- 🗺️ 5가지 사투리 번역 지원 (강원도, 경상도, 전라도, 제주도, 북한)
- 🎙️ 번역된 사투리를 생생한 억양의 음성(TTS)으로 재생
- 💾 Supabase 연동을 통한 대화 기록 실시간 저장 및 불러오기

---

## 🏗️ 전체 아키텍처 및 폴더 구조 (Refactored)

이 프로젝트는 유지보수성과 확장성을 위해 프론트엔드와 백엔드를 물리적으로 분리하였으며, 각각 최신 아키텍처 패턴을 도입하여 재구성되었습니다.

### 1. 프론트엔드 (FSD 아키텍처)
프론트엔드 코드(`frontend/`)는 **Feature-Sliced Design (FSD)** 방법론을 도입하여 6개의 명확한 레이어로 분리되었습니다.

```text
jemini/frontend/
 ├── src/
 │    ├── app/       (전역 설정, 라우팅, 글로벌 스타일)
 │    ├── pages/     (MainPage 등 전체 화면 레이아웃)
 │    ├── widgets/   (Sidebar, ChatWindow 등 기능의 조합)
 │    ├── features/  (ChatInput, PlayTTS 등 사용자와 상호작용하는 구체적 기능)
 │    ├── entities/  (Chat, Message 등 비즈니스 도메인 데이터 모델 및 UI)
 │    └── shared/    (공통 API 설정, 유틸리티, 아이콘)
 ├── package.json
 └── vite.config.js
```

### 2. 백엔드 (클린 아키텍처 & TDD)
백엔드 코드(`backend/`)는 외부 기술(FastAPI, Supabase, Gemini)과 비즈니스 로직을 분리하는 **클린 아키텍처(Clean Architecture)**를 도입하였으며, **TDD(테스트 주도 개발)** 기반으로 작성되었습니다.

```text
jemini/backend/
 ├── app/
 │    ├── domain/           (데이터 모델 및 엔티티 정의)
 │    ├── application/      (순수 비즈니스 로직 Use Case 및 인터페이스 명세)
 │    ├── infrastructure/   (Supabase, Gemini 등 실제 외부 서비스 연동 구현체)
 │    └── presentation/     (FastAPI 라우터 엔드포인트)
 ├── tests/
 │    └── unit/             (Mock 객체를 활용한 비즈니스 로직 TDD 단위 테스트)
 ├── main.py                (FastAPI 실행 및 모든 의존성 주입 조립)
 └── requirements.txt
```

---

## 🚀 실행 방법

이 프로젝트는 프론트엔드(React/Vite)와 백엔드(FastAPI) 두 개의 서버를 동시에 실행해야 합니다.

### 1. 백엔드 실행 (FastAPI)
새 터미널을 열고 다음을 입력합니다.
```bash
cd backend
pip install -r requirements.txt
# .env 파일에 SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY 설정 필수
uvicorn main:app --reload --port 8000
```
> 단위 테스트 실행: `python -m pytest tests/unit`
> **서버 주소**: http://localhost:8000 (API 문서: http://localhost:8000/docs)

### 2. 프론트엔드 실행 (React/Vite)
다른 새 터미널을 열고 다음을 입력합니다.
```bash
cd frontend
npm install
npm run dev
```
> **앱 접속 주소**: http://localhost:5173

---

## 🛠️ 기술 스택
- **Frontend**: React, Vite, CSS(vanilla), Lucide-React
- **Backend**: Python, FastAPI, Pytest
- **Database / API**: Supabase (PostgreSQL), Google Gemini 3.5 Flash
