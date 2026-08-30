from fastapi import APIRouter, Depends, HTTPException
from app.domain.schemas import ChatRequest, ChatCreateRequest, TTSRequest
from app.application.use_cases import ProcessChatUseCase
from app.application.interfaces import IChatRepository, IMessageRepository, ILLMService
import traceback

router = APIRouter(prefix="/api")

def get_chat_repo() -> IChatRepository:
    raise NotImplementedError

def get_message_repo() -> IMessageRepository:
    raise NotImplementedError

def get_llm_service() -> ILLMService:
    raise NotImplementedError

def get_process_chat_use_case(
    chat_repo: IChatRepository = Depends(get_chat_repo),
    msg_repo: IMessageRepository = Depends(get_message_repo),
    llm_service: ILLMService = Depends(get_llm_service)
) -> ProcessChatUseCase:
    return ProcessChatUseCase(chat_repo, msg_repo, llm_service)

@router.get("/history")
async def get_history(user_id: str = None, chat_repo: IChatRepository = Depends(get_chat_repo)):
    return await chat_repo.get_all_chats(user_id)

@router.post("/chats")
async def create_chat_endpoint(request: ChatCreateRequest, chat_repo: IChatRepository = Depends(get_chat_repo)):
    try:
        initial_msgs = [m.model_dump() if hasattr(m, 'model_dump') else m.dict() if hasattr(m, 'dict') else m for m in request.initial_messages] if request.initial_messages else None
        return await chat_repo.create_chat(request.title, request.user_id, initial_msgs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chats/{chat_id}")
async def delete_chat_endpoint(chat_id: int, chat_repo: IChatRepository = Depends(get_chat_repo)):
    try:
        success = await chat_repo.delete_chat(chat_id)
        return {"success": success, "message": "채팅방이 삭제되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chats/{chat_id}/messages")
async def get_messages(chat_id: int, msg_repo: IMessageRepository = Depends(get_message_repo)):
    return await msg_repo.get_messages(chat_id)

@router.post("/chat")
async def process_chat_endpoint(
    request: ChatRequest,
    use_case: ProcessChatUseCase = Depends(get_process_chat_use_case)
):
    try:
        return await use_case.execute(
            chat_id=request.chatId,
            text=request.text,
            region=request.region,
            image_base64=request.image_base64,
            provider=request.provider,
            model=request.model
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error processing chat")

@router.post("/tts")
async def process_tts(request: TTSRequest):
    return {"success": True, "message": "FastAPI TTS Route Reached"}
