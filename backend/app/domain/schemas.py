from pydantic import BaseModel, Field
from typing import Optional, List

class TranslationResponse(BaseModel):
    content: str = Field(
        description="선택한 지역의 구수한 사투리로 맛깔나게 의역 및 묘사된 번역 결과 본문 (마크다운 포맷 가능)"
    )
    suggested_questions: List[str] = Field(
        description="사용자가 이어서 질문할 만한 사투리 봇 특화 후속 추천 질문 3개",
        max_length=3
    )

class ChatRequest(BaseModel):
    chatId: int
    text: str
    region: str
    image_base64: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None

class ChatMessageItem(BaseModel):
    role: str
    content: str
    region: Optional[str] = "경상도"

class ChatCreateRequest(BaseModel):
    title: str
    user_id: Optional[str] = None
    initial_messages: Optional[List[ChatMessageItem]] = None

class TTSRequest(BaseModel):
    text: str
    region: str

class ChatResponse(BaseModel):
    id: int
    title: str
    user_id: Optional[str] = None
    created_at: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    chat_id: int
    role: str
    content: str
    region: str
    created_at: Optional[str] = None
    suggested_questions: Optional[List[str]] = None
