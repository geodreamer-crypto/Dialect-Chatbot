import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import asyncio
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class ChatRequest(BaseModel):
    chatId: int
    text: str
    region: str

class ChatCreateRequest(BaseModel):
    title: str

class TTSRequest(BaseModel):
    text: str
    region: str

@app.get("/api/history")
async def get_history():
    response = supabase.table("chats").select("*").order("created_at", desc=True).execute()
    return response.data

@app.post("/api/chats")
async def create_chat(request: ChatCreateRequest):
    response = supabase.table("chats").insert({"title": request.title}).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create chat")
    return response.data[0]

@app.get("/api/chats/{chat_id}/messages")
async def get_messages(chat_id: int):
    response = supabase.table("messages").select("*").eq("chat_id", chat_id).order("created_at").execute()
    return response.data

@app.post("/api/chat")
async def process_chat(request: ChatRequest):
    # 1. 사용자 메시지 저장
    supabase.table("messages").insert({
        "chat_id": request.chatId,
        "role": "user",
        "content": request.text,
        "region": request.region
    }).execute()

    # 채팅방 제목 업데이트 (기본 제목인 경우 사용자의 첫 메시지로 변경)
    chat = supabase.table("chats").select("title").eq("id", request.chatId).execute()
    if chat.data:
        current_title = chat.data[0]["title"]
        if current_title in ["새로운 사투리 번역", "기본 대화방"]:
            new_title = request.text[:20]
            if len(request.text) > 20:
                new_title += "..."
            supabase.table("chats").update({"title": new_title}).eq("id", request.chatId).execute()

    # 2. LLM 번역 처리 (Gemini API)
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key or gemini_key == "YOUR_GEMINI_API_KEY_HERE":
        await asyncio.sleep(1)
        bot_response = f"""선택하신 **{request.region}** 사투리로 번역된 결과입니다.\n\n"아이고, 밥은 묵읏나? 단디 챙기무라."\n\n```python\n# 안내: 백엔드 .env 파일에 GEMINI_API_KEY를 설정해주세요!\nprint("현재는 모의 응답 모드입니다.")\n```\n"""
    else:
        try:
            client = genai.Client(api_key=gemini_key)
            prompt = f"""
당신은 북한 지역, 경상도, 전라도, 강원도, 제주도에 30년 이상 거주한 완전한 토박이입니다.
다음 입력된 표준어 문장을 {request.region} 사투리로 번역해주세요.
흥미를 더하기 위해 단순한 직역이 아닌 '의역'을 해주시고, 해당 {request.region} 사투리 특유의 어휘와 어감이 아주 짙게 묻어나도록 맛깔나게 번역해 주셔야 합니다.
번역된 사투리 결과만 깔끔하게 출력하고, 다른 부가적인 설명은 절대 하지 마세요.

입력 문장: {request.text}
"""
            response = await asyncio.to_thread(client.models.generate_content, model="gemini-3.5-flash", contents=prompt)
            bot_response = response.text
        except Exception as e:
            bot_response = f"⚠️ Gemini API 호출 에러가 발생했습니다.\\n\\n입력하신 API 키가 유효하지 않거나 문제가 있습니다. Google AI Studio에서 발급받은 `AIzaSy` 로 시작하는 유효한 키인지 다시 한번 확인해 주세요."
    
    # 3. 챗봇 메시지 저장
    bot_msg = supabase.table("messages").insert({
        "chat_id": request.chatId,
        "role": "bot",
        "content": bot_response,
        "region": request.region
    }).execute()
    
    if not bot_msg.data:
        raise HTTPException(status_code=500, detail="Failed to save bot message")
        
    return bot_msg.data[0]

@app.post("/api/tts")
async def process_tts(request: TTSRequest):
    # 실제 외부 TTS 연동 코드가 들어갈 자리
    return {"success": True, "message": "FastAPI TTS Route Reached"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
