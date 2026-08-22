import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.domain.schemas import TranslationResponse
from app.infrastructure.langchain_service import LangChainService

@pytest.mark.asyncio
async def test_langchain_service_mock_mode_when_no_api_key():
    """
    API 키가 없거나 기본값일 때 친절한 Mock 안내 응답과 추천 질문 3개를 반환해야 함.
    """
    with patch.dict("os.environ", {}, clear=True):
        service = LangChainService(default_provider="google_genai", default_model="gemini-3.6-flash")
        result = await service.translate(text="밥 먹었니?", region="경상도")
        
        assert "content" in result
        assert "suggested_questions" in result
        assert len(result["suggested_questions"]) == 3
        assert "경상도" in result["content"]

@pytest.mark.asyncio
async def test_langchain_service_structured_output_invocation():
    """
    LangChain 모델의 with_structured_output 호출 및 TranslationResponse 반환 검증.
    """
    mock_model = MagicMock()
    mock_structured_llm = MagicMock()
    
    expected_response = TranslationResponse(
        content="밥 묵읏나? 단디 챙겨 묵으라.",
        suggested_questions=[
            "이 표현을 전라도 사투리로 바꾸면 어떻게 돼?",
            "'단디'의 억양과 발음 팁을 알려줘",
            "식당에서 쓸 수 있는 다른 경상도 표현도 알려줘"
        ]
    )
    mock_structured_llm.ainvoke = AsyncMock(return_value=expected_response)
    mock_model.with_structured_output.return_value = mock_structured_llm

    service = LangChainService(default_provider="google_genai", default_model="gemini-3.6-flash")
    
    with patch.object(service, "get_model", return_value=mock_model):
        result = await service.translate(text="밥 먹었니?", region="경상도")
        
        assert result["content"] == "밥 묵읏나? 단디 챙겨 묵으라."
        assert len(result["suggested_questions"]) == 3
        assert result["suggested_questions"][0] == "이 표현을 전라도 사투리로 바꾸면 어떻게 돼?"
        mock_model.with_structured_output.assert_called_once_with(TranslationResponse)
        mock_structured_llm.ainvoke.assert_called_once()

@pytest.mark.asyncio
async def test_langchain_service_multimodal_message_construction():
    """
    이미지 첨부 시 HumanMessage에 text와 image_url 형식의 멀티모달 컨텐츠가 올바르게 생성되는지 검증.
    """
    mock_model = MagicMock()
    mock_structured_llm = MagicMock()
    
    expected_response = TranslationResponse(
        content="이것은 맛난 전라도 비빔밥이랑께!",
        suggested_questions=[
            "전라도 사투리로 반찬 추천해줘",
            "비빔밥 먹을 때 쓰는 사투리 표현은?",
            "다른 지역 비빔밥은 뭐라고 불러?"
        ]
    )
    mock_structured_llm.ainvoke = AsyncMock(return_value=expected_response)
    mock_model.with_structured_output.return_value = mock_structured_llm

    service = LangChainService(default_provider="openai", default_model="gpt-4o-mini")
    
    with patch.object(service, "get_model", return_value=mock_model):
        sample_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA"
        result = await service.translate(text="이 음식 뭐야?", region="전라도", image_base64=sample_b64)
        
        assert result["content"] == "이것은 맛난 전라도 비빔밥이랑께!"
        # ainvoke에 전달된 messages 인자 검증
        call_args = mock_structured_llm.ainvoke.call_args[0][0]
        # call_args는 [SystemMessage, HumanMessage]
        assert len(call_args) == 2
        human_msg = call_args[1]
        assert isinstance(human_msg.content, list)
        assert human_msg.content[0]["type"] == "text"
        assert human_msg.content[1]["type"] == "image_url"
        assert human_msg.content[1]["image_url"]["url"] == sample_b64

@pytest.mark.asyncio
async def test_langchain_service_error_handling_fallback():
    """
    LangChain API 호출 도중 예외가 발생할 경우 안전한 에러 안내 및 기본 추천 질문을 반환해야 함.
    """
    mock_model = MagicMock()
    mock_structured_llm = MagicMock()
    mock_structured_llm.ainvoke = AsyncMock(side_effect=Exception("API Rate Limit Exceeded"))
    mock_model.with_structured_output.return_value = mock_structured_llm

    service = LangChainService(default_provider="google_genai", default_model="gemini-3.6-flash")
    
    with patch.object(service, "get_model", return_value=mock_model):
        result = await service.translate(text="안녕하세요", region="제주도")
        
        assert "⚠️" in result["content"]
        assert len(result["suggested_questions"]) == 3
