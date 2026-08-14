from app.application.interfaces import IChatRepository, IMessageRepository, ILLMService

class ProcessChatUseCase:
    def __init__(self, chat_repo: IChatRepository, msg_repo: IMessageRepository, llm_service: ILLMService):
        self.chat_repo = chat_repo
        self.msg_repo = msg_repo
        self.llm_service = llm_service

    async def execute(self, chat_id: int, text: str, region: str) -> dict:
        # 1. 사용자 메시지 저장
        await self.msg_repo.save_message(chat_id, "user", text, region)

        # 2. 채팅방 제목 업데이트 (기본 제목인 경우 사용자의 첫 메시지로 변경)
        current_title = await self.chat_repo.get_chat_title(chat_id)
        if current_title in ["새로운 사투리 번역", "기본 대화방"]:
            new_title = text[:20]
            if len(text) > 20:
                new_title += "..."
            await self.chat_repo.update_chat_title(chat_id, new_title)

        # 3. LLM 번역 처리
        bot_response = await self.llm_service.translate(text, region)

        # 4. 챗봇 메시지 저장
        bot_msg = await self.msg_repo.save_message(chat_id, "bot", bot_response, region)
        
        return bot_msg
