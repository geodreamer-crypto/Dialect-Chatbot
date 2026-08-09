# 사투리 번역 챗봇 (Gemini UI Clone)

이 프로젝트는 표준어를 다양한 지역(강원, 북한, 전라, 경상, 제주) 사투리로 번역해 주고 음성으로 읽어주는 챗봇 서비스입니다.
유려한 다크모드 UI와 함께 **React(Vite) + FastAPI + Supabase(PostgreSQL)** 풀스택 환경으로 구성되어 있습니다.

## 🚀 기술 스택
- **Frontend**: React, Vite, CSS (Dark Mode), Lucide Icons
- **Backend**: Python, FastAPI, Uvicorn
- **Database**: Supabase (PostgreSQL)

---

## 💻 실행 방법 (로컬 개발 환경)

본 어플리케이션을 구동하기 위해서는 **백엔드 서버**와 **프론트엔드 서버**를 각각 실행해야 합니다. (VScode나 터미널 창을 2개 열어주세요.)

### 1. 백엔드(FastAPI) 실행하기
파이썬(Python)이 설치되어 있어야 합니다. 첫 번째 터미널에서 아래 명령어를 순서대로 입력하세요.

```bash
# 1. 백엔드 폴더로 이동
cd backend

# 2. 파이썬 필수 패키지 설치
pip install -r requirements.txt

# 3. FastAPI 서버 실행
uvicorn main:app --reload
```
> 정상적으로 실행되면 `http://127.0.0.1:8000` 에서 백엔드 서버가 대기합니다.

### 2. 프론트엔드(React) 실행하기
Node.js가 설치되어 있어야 합니다. 새로운 터미널 탭을 열고 아래 명령어를 입력하세요.

```bash
# 1. 프로젝트 최상단 폴더(jemini)에서 시작
# (만약 backend 폴더 안에 있다면 cd .. 명령어로 상위 폴더로 이동)

# 2. 패키지 설치 (최초 1회만)
npm install

# 3. 프론트엔드 개발 서버 실행
npm run dev
```
> 터미널에 출력된 `http://localhost:5173` 등의 링크를 **Ctrl + 클릭**하여 브라우저에서 챗봇을 열어주세요!

---

## 🛠 실무 연동 포인트 (추후 개발 가이드)
현재 통신 로직은 모두 완성되어 있으나, 외부 유료 API 연결을 위해 딜레이(Mock) 응답 코드가 들어가 있습니다. 
실제 상용화를 원하실 경우 `backend/main.py` 파일을 열어 다음 부분을 수정하세요.
1. `process_chat` 함수 내부: Gemini/OpenAI API 연동 코드 추가
2. `process_tts` 함수 내부: 사투리 지원 TTS (네이버 Clova Voice 등) 연동 코드 추가
