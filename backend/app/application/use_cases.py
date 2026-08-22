from app.application.interfaces import IChatRepository, IMessageRepository, ILLMService

class ProcessChatUseCase:
    def __init__(self, chat_repo: IChatRepository, msg_repo: IMessageRepository, llm_service: ILLMService):
        self.chat_repo = chat_repo
        self.msg_repo = msg_repo
        self.llm_service = llm_service

    async def execute(
        self,
        chat_id: int,
        text: str,
        region: str,
        image_base64: str = None,
        provider: str = None,
        model: str = None
    ) -> dict:
        # 1. 사용자 메시지 저장
        content_to_save = f"[이미지 첨부됨] {text}" if image_base64 else text
        await self.msg_repo.save_message(chat_id, "user", content_to_save, region)

        # 2. 채팅방 제목 업데이트 (기본 제목인 경우 사용자의 첫 메시지로 변경)
        current_title = await self.chat_repo.get_chat_title(chat_id)
        if current_title in ["새로운 사투리 번역", "기본 대화방"]:
            new_title = text[:20]
            if len(text) > 20:
                new_title += "..."
            await self.chat_repo.update_chat_title(chat_id, new_title)

        # 3. LLM 번역 및 추천 질문 생성 처리 (다중 벤더 지원)
        llm_result = await self.llm_service.translate(
            text=text,
            region=region,
            image_base64=image_base64,
            provider=provider,
            model=model
        )
        if isinstance(llm_result, dict):
            bot_content = llm_result.get("content", "")
            suggested_questions = llm_result.get("suggested_questions", [])
        else:
            bot_content = str(llm_result)
            suggested_questions = []

        # 4. 챗봇 메시지 저장 (본문만 DB에 저장)
        bot_msg = await self.msg_repo.save_message(chat_id, "bot", bot_content, region)
        
        # 5. 프론트엔드 반환용 추천 질문 필드 결합
        bot_msg["suggested_questions"] = suggested_questions
        return bot_msg
