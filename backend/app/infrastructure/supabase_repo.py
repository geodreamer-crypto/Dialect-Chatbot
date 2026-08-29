from app.application.interfaces import IChatRepository, IMessageRepository
from supabase import Client
from typing import List, Optional

class SupabaseChatRepository(IChatRepository):
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def get_all_chats(self) -> List[dict]:
        response = self.supabase.table("chats").select("*").order("created_at", desc=True).execute()
        return response.data

    async def create_chat(self, title: str) -> dict:
        response = self.supabase.table("chats").insert({"title": title}).execute()
        if not response.data:
            raise Exception("Failed to create chat")
        return response.data[0]

    async def get_chat_title(self, chat_id: int) -> Optional[str]:
        chat = self.supabase.table("chats").select("title").eq("id", chat_id).execute()
        if chat.data:
            return chat.data[0]["title"]
        return None

    async def update_chat_title(self, chat_id: int, title: str) -> None:
        self.supabase.table("chats").update({"title": title}).eq("id", chat_id).execute()

    async def delete_chat(self, chat_id: int) -> bool:
        """
        대화방을 삭제합니다. 외래 키 제약 조건 및 데이터 정합성을 위해 
        해당 대화방에 속한 messages를 먼저 삭제한 후 chats 테이블의 대화방을 삭제합니다.
        """
        self.supabase.table("messages").delete().eq("chat_id", chat_id).execute()
        response = self.supabase.table("chats").delete().eq("id", chat_id).execute()
        return bool(response.data)

class SupabaseMessageRepository(IMessageRepository):
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def get_messages(self, chat_id: int) -> List[dict]:
        response = self.supabase.table("messages").select("*").eq("chat_id", chat_id).order("created_at").execute()
        return response.data

    async def save_message(self, chat_id: int, role: str, content: str, region: str) -> dict:
        response = self.supabase.table("messages").insert({
            "chat_id": chat_id,
            "role": role,
            "content": content,
            "region": region
        }).execute()
        if not response.data:
            raise Exception("Failed to save message")
        return response.data[0]
