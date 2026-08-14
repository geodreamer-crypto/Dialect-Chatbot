from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    chatId: int
    text: str
    region: str

class ChatCreateRequest(BaseModel):
    title: str

class TTSRequest(BaseModel):
    text: str
    region: str

class ChatResponse(BaseModel):
    id: int
    title: str
    created_at: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    chat_id: int
    role: str
    content: str
    region: str
    created_at: Optional[str] = None
