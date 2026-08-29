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

    async def delete_chat(self, chat_id: int) -> bool:
        if chat_id in self.chats:
            del self.chats[chat_id]
            return True
        return False

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
    async def translate(
        self,
        text: str,
        region: str,
        image_base64: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None
    ) -> dict:
        prefix = f"[{provider}/{model}] " if provider or model else ""
        content = f"{prefix}Translated with image to {region}: {text}" if image_base64 else f"{prefix}Translated to {region}: {text}"
        suggested_questions = [
            f"이 표현을 다른 사투리로 바꾸면 어떻게 돼?",
            f"이 사투리의 억양과 발음 팁을 알려줘",
            f"'{region}' 지역의 다른 실생활 표현도 추천해줘"
        ]
        return {
            "content": content,
            "suggested_questions": suggested_questions
        }

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

    # 3. Check if bot message is saved and returned with suggested questions
    assert response is not None
    assert response["role"] == "bot"
    assert response["content"] == "Translated to 경상도: 안녕하세요"
    assert "suggested_questions" in response
    assert len(response["suggested_questions"]) == 3
    assert response["suggested_questions"][0] == "이 표현을 다른 사투리로 바꾸면 어떻게 돼?"
    assert msg_repo.messages[1]["role"] == "bot"

@pytest.mark.asyncio
async def test_process_chat_with_image():
    chat_repo = MockChatRepo()
    chat_repo.chats[1] = "이미 설정된 대화방 제목"
    msg_repo = MockMessageRepo()
    llm_service = MockLLMService()

    use_case = ProcessChatUseCase(chat_repo, msg_repo, llm_service)

    response = await use_case.execute(
        chat_id=1,
        text="이 음식 뭐야?",
        region="전라도",
        image_base64="data:image/jpeg;base64,samplebase64"
    )

    # 1. Check if user message saves [이미지 첨부됨]
    assert msg_repo.messages[0]["content"] == "[이미지 첨부됨] 이 음식 뭐야?"

    # 2. Check that custom title was preserved
    assert chat_repo.chats[1] == "이미 설정된 대화방 제목"

    # 3. Check bot response contains image translation and suggested questions
    assert response["content"] == "Translated with image to 전라도: 이 음식 뭐야?"
    assert "suggested_questions" in response
    assert len(response["suggested_questions"]) == 3

@pytest.mark.asyncio
async def test_process_chat_with_custom_provider_and_model():
    chat_repo = MockChatRepo()
    msg_repo = MockMessageRepo()
    llm_service = MockLLMService()

    use_case = ProcessChatUseCase(chat_repo, msg_repo, llm_service)

    response = await use_case.execute(
        chat_id=1,
        text="안녕하세요",
        region="강원도",
        provider="openai",
        model="gpt-4o-mini"
    )

    assert response["content"] == "[openai/gpt-4o-mini] Translated to 강원도: 안녕하세요"
    assert len(response["suggested_questions"]) == 3
