from abc import ABC, abstractmethod
from typing import List, Optional

class IChatRepository(ABC):
    @abstractmethod
    async def get_all_chats(self, user_id: Optional[str] = None) -> List[dict]:
        """
        사용자별 대화방 목록을 조회합니다. user_id가 없으면 빈 목록을 반환합니다.
        """
        pass

    @abstractmethod
    async def create_chat(
        self,
        title: str,
        user_id: Optional[str] = None,
        initial_messages: Optional[List[dict]] = None
    ) -> dict:
        """
        사용자의 새 대화방을 생성합니다.
        게스트 세션에서 나눈 이전 대화(initial_messages)가 있으면 함께 DB에 저장합니다.
        """
        pass

    @abstractmethod
    async def get_chat_title(self, chat_id: int) -> Optional[str]:
        pass

    @abstractmethod
    async def update_chat_title(self, chat_id: int, title: str) -> None:
        pass

    @abstractmethod
    async def delete_chat(self, chat_id: int) -> bool:
        """
        대화방 및 연관된 메시지를 삭제합니다.
        """
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

class IEncryptionService(ABC):
    """
    민감 대화 데이터(본문 및 제목)의 양방향 대칭키 암호화/복호화 인터페이스
    """
    @abstractmethod
    def encrypt(self, plaintext: Optional[str]) -> Optional[str]:
        pass

    @abstractmethod
    def decrypt(self, ciphertext: Optional[str]) -> Optional[str]:
        pass

