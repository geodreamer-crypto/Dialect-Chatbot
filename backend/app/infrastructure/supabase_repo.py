from app.application.interfaces import IChatRepository, IMessageRepository, IEncryptionService
from supabase import Client
from typing import List, Optional

class SupabaseChatRepository(IChatRepository):
    def __init__(self, supabase: Client, encryption_service: Optional[IEncryptionService] = None):
        self.supabase = supabase
        self.encryption = encryption_service

    def _encrypt(self, text: Optional[str]) -> Optional[str]:
        if self.encryption:
            return self.encryption.encrypt(text)
        return text

    def _decrypt(self, text: Optional[str]) -> Optional[str]:
        if self.encryption:
            return self.encryption.decrypt(text)
        return text

    async def get_all_chats(self, user_id: Optional[str] = None) -> List[dict]:
        """
        사용자별 대화방 목록을 조회합니다.
        보안 및 개인화 격리를 위해 user_id가 없는(비로그인) 경우 빈 리스트를 반환합니다.
        각 대화방 제목(title)은 복호화되어 사용자에게 전달됩니다.
        """
        if not user_id:
            return []
        response = self.supabase.table("chats").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        chats = response.data or []
        for chat in chats:
            if "title" in chat:
                chat["title"] = self._decrypt(chat["title"])
        return chats

    async def create_chat(
        self,
        title: str,
        user_id: Optional[str] = None,
        initial_messages: Optional[List[dict]] = None
    ) -> dict:
        """
        새 대화방을 생성합니다. 사용자 식별자(user_id)가 제공되면 함께 저장하며,
        대화방 제목(title)은 AES-256-GCM으로 암호화되어 DB에 저장됩니다.
        게스트 세션의 이전 대화(initial_messages)가 있으면 해당 대화방 메시지로 일괄 암호화 저장합니다.
        """
        encrypted_title = self._encrypt(title)
        payload = {"title": encrypted_title}
        if user_id:
            payload["user_id"] = user_id

        response = self.supabase.table("chats").insert(payload).execute()
        if not response.data:
            raise Exception("Failed to create chat")
        
        created_chat = response.data[0]
        chat_id = created_chat["id"]

        # 게스트 세션 대화 내용 일괄 마이그레이션(저장)
        if initial_messages:
            msgs_to_insert = []
            for msg in initial_messages:
                raw_content = msg.get("content", "")
                if raw_content:
                    msgs_to_insert.append({
                        "chat_id": chat_id,
                        "role": msg.get("role", "user"),
                        "content": self._encrypt(raw_content),
                        "region": msg.get("region", "경상도")
                    })
            if msgs_to_insert:
                self.supabase.table("messages").insert(msgs_to_insert).execute()

        result = dict(created_chat)
        # 클라이언트 반환용으로는 복호화된 원문 제목 제공
        result["title"] = title
        return result

    async def get_chat_title(self, chat_id: int) -> Optional[str]:
        chat = self.supabase.table("chats").select("title").eq("id", chat_id).execute()
        if chat.data:
            return self._decrypt(chat.data[0]["title"])
        return None

    async def update_chat_title(self, chat_id: int, title: str) -> None:
        encrypted_title = self._encrypt(title)
        self.supabase.table("chats").update({"title": encrypted_title}).eq("id", chat_id).execute()

    async def delete_chat(self, chat_id: int) -> bool:
        """
        대화방을 삭제합니다. 외래 키 제약 조건 및 데이터 정합성을 위해 
        해당 대화방에 속한 messages를 먼저 삭제한 후 chats 테이블의 대화방을 삭제합니다.
        """
        self.supabase.table("messages").delete().eq("chat_id", chat_id).execute()
        response = self.supabase.table("chats").delete().eq("id", chat_id).execute()
        return bool(response.data)

class SupabaseMessageRepository(IMessageRepository):
    def __init__(self, supabase: Client, encryption_service: Optional[IEncryptionService] = None):
        self.supabase = supabase
        self.encryption = encryption_service

    def _encrypt(self, text: Optional[str]) -> Optional[str]:
        if self.encryption:
            return self.encryption.encrypt(text)
        return text

    def _decrypt(self, text: Optional[str]) -> Optional[str]:
        if self.encryption:
            return self.encryption.decrypt(text)
        return text

    async def get_messages(self, chat_id: int) -> List[dict]:
        """
        해당 대화방의 메시지 목록을 조회하고, 암호화된 본문(content)을 복호화하여 반환합니다.
        """
        response = self.supabase.table("messages").select("*").eq("chat_id", chat_id).order("created_at").execute()
        messages = response.data or []
        for msg in messages:
            if "content" in msg:
                msg["content"] = self._decrypt(msg["content"])
        return messages

    async def save_message(self, chat_id: int, role: str, content: str, region: str) -> dict:
        """
        대화 메시지를 저장합니다. 메시지 본문(content)은 AES-256-GCM으로 암호화되어 DB에 저장됩니다.
        """
        encrypted_content = self._encrypt(content)
        response = self.supabase.table("messages").insert({
            "chat_id": chat_id,
            "role": role,
            "content": encrypted_content,
            "region": region
        }).execute()
        if not response.data:
            raise Exception("Failed to save message")
        
        result = dict(response.data[0])
        # 클라이언트 반환 시에는 복호화된 원문 본문 제공
        result["content"] = content
        return result

