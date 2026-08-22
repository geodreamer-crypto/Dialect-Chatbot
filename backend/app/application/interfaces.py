from abc import ABC, abstractmethod
from typing import List, Optional

class IChatRepository(ABC):
    @abstractmethod
    async def get_all_chats(self) -> List[dict]:
        pass

    @abstractmethod
    async def create_chat(self, title: str) -> dict:
        pass

    @abstractmethod
    async def get_chat_title(self, chat_id: int) -> Optional[str]:
        pass

    @abstractmethod
    async def update_chat_title(self, chat_id: int, title: str) -> None:
        pass

class IMessageRepository(ABC):
    @abstractmethod
    async def get_messages(self, chat_id: int) -> List[dict]:
        pass

    @abstractmethod
    async def save_message(self, chat_id: int, role: str, content: str, region: str) -> dict:
        pass

class ILLMService(ABC):
    @abstractmethod
    async def translate(
        self,
        text: str,
        region: str,
        image_base64: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None
    ) -> dict:
        """
        사투리 번역 및 후속 질문 생성
        반환값: {"content": str, "suggested_questions": List[str]}
        """
        pass
