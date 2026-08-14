import pytest
from app.application.use_cases import ProcessChatUseCase
from app.application.interfaces import IChatRepository, IMessageRepository, ILLMService
from typing import List, Optional

class MockChatRepo(IChatRepository):
    def __init__(self):
        self.chats = {1: "새로운 사투리 번역"}

    async def get_all_chats(self) -> List[dict]:
        return [{"id": 1, "title": "새로운 사투리 번역"}]

    async def create_chat(self, title: str) -> dict:
        return {"id": 2, "title": title}

    async def get_chat_title(self, chat_id: int) -> Optional[str]:
        return self.chats.get(chat_id)

    async def update_chat_title(self, chat_id: int, title: str) -> None:
        self.chats[chat_id] = title

class MockMessageRepo(IMessageRepository):
    def __init__(self):
        self.messages = []
        self.id_counter = 1

    async def get_messages(self, chat_id: int) -> List[dict]:
        return [m for m in self.messages if m["chat_id"] == chat_id]

    async def save_message(self, chat_id: int, role: str, content: str, region: str) -> dict:
        msg = {"id": self.id_counter, "chat_id": chat_id, "role": role, "content": content, "region": region}
        self.messages.append(msg)
        self.id_counter += 1
        return msg

class MockLLMService(ILLMService):
    async def translate(self, text: str, region: str) -> str:
        return f"Translated to {region}: {text}"

@pytest.mark.asyncio
async def test_process_chat_updates_title_and_saves_messages():
    chat_repo = MockChatRepo()
    msg_repo = MockMessageRepo()
    llm_service = MockLLMService()

    use_case = ProcessChatUseCase(chat_repo, msg_repo, llm_service)
    
    # Run the use case
    response = await use_case.execute(chat_id=1, text="안녕하세요", region="경상도")

    # 1. Check if user message is saved
    assert msg_repo.messages[0]["role"] == "user"
    assert msg_repo.messages[0]["content"] == "안녕하세요"

    # 2. Check if chat title is updated (since it was "새로운 사투리 번역")
    assert chat_repo.chats[1] == "안녕하세요"

    # 3. Check if bot message is saved and returned
    assert response is not None
    assert response["role"] == "bot"
    assert response["content"] == "Translated to 경상도: 안녕하세요"
    assert msg_repo.messages[1]["role"] == "bot"
