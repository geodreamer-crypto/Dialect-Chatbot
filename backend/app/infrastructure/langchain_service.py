import os
import asyncio
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from langchain_core.messages import HumanMessage, SystemMessage
from langchain.chat_models import init_chat_model
from app.application.interfaces import ILLMService
from app.domain.schemas import TranslationResponse

class LangChainService(ILLMService):
    """
    최신 LangChain(init_chat_model + with_structured_output)을 기반으로 한 다중 LLM 벤더 지원 서비스.
    Google GenAI, OpenAI, Anthropic, Ollama 등 다양한 벤더사의 모델을 통일된 방식으로 호출합니다.
    """
    def __init__(
        self,
        default_provider: Optional[str] = None,
        default_model: Optional[str] = None,
        temperature: float = 0.7
    ):
        # 환경 변수 또는 기본값에서 설정 로드
        self.default_provider = default_provider or os.getenv("DEFAULT_LLM_PROVIDER", "google_genai")
        self.default_model = default_model or os.getenv("DEFAULT_LLM_MODEL", "gemini-3.6-flash")
        self.temperature = temperature
        self._model_cache: Dict[str, Any] = {}

    def _get_api_key_for_provider(self, provider: str) -> Optional[str]:
        """
        제공업체(Provider)에 맞는 API 키를 환경 변수에서 조회합니다.
        """
        provider_lower = provider.lower()
        if provider_lower in ["google_genai", "google", "gemini"]:
            return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        elif provider_lower == "openai":
            return os.getenv("OPENAI_API_KEY")
        elif provider_lower == "anthropic":
            return os.getenv("ANTHROPIC_API_KEY")
        return None

    def get_model(self, provider: Optional[str] = None, model_name: Optional[str] = None):
        """
        LangChain의 init_chat_model을 사용하여 해당 공급자 및 모델의 인스턴스를 가져옵니다.
        """
        target_provider = (provider or self.default_provider).lower()
        # provider 정규화 (gemini/google -> google_genai)
        if target_provider in ["gemini", "google"]:
            target_provider = "google_genai"

        target_model = model_name or self.default_model

        # 벤더별 기본 모델 자동 매핑 (만약 모델명이 지정되지 않았거나 기본값일 때 유연하게 처리)
        if not model_name:
            if target_provider == "openai":
                target_model = "gpt-4o-mini"
            elif target_provider == "anthropic":
                target_model = "claude-3-5-sonnet-20241022"
            elif target_provider == "google_genai":
                target_model = "gemini-3.6-flash"

        cache_key = f"{target_provider}:{target_model}:{self.temperature}"
        if cache_key in self._model_cache:
            return self._model_cache[cache_key]

        api_key = self._get_api_key_for_provider(target_provider)
        
        # API Key가 없는 경우 (Ollama 등 로컬 모델 제외) None 반환하여 Mock 모드로 유도
        if target_provider != "ollama" and (not api_key or api_key.startswith("YOUR_")):
            return None

        # init_chat_model 인자 구성
        init_kwargs = {
            "model": target_model,
            "model_provider": target_provider,
            "temperature": self.temperature,
        }

        if api_key:
            init_kwargs["api_key"] = api_key

        if target_provider == "ollama":
            ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            init_kwargs["base_url"] = ollama_base_url

        try:
            model = init_chat_model(**init_kwargs)
            self._model_cache[cache_key] = model
            return model
        except Exception as e:
            print(f"⚠️ Failed to initialize LangChain model for {target_provider}/{target_model}: {e}")
            return None

    def _build_system_instruction(self, region: str) -> str:
        """
        사투리 번역 및 특화 추천 질문 생성을 위한 시스템 프롬프트를 구성합니다.
        """
        return f"""당신은 북한 지역, 경상도, 전라도, 강원도, 제주도 등 전국의 사투리에 능통한 30년 토박이 사투리 전문가입니다.

[역할 및 지침]
1. 입력된 표준어 문장과 (주어진 경우) 사진을 바탕으로 상황을 {region} 사투리로 맛깔나게 의역 및 묘사하세요. 단순 직역이 아니라 해당 {region} 사투리 특유의 어감과 뉘앙스가 짙게 묻어나야 합니다.
2. 답변(content)과 함께, 사용자가 이어서 흥미롭게 물어볼 만한 '사투리 봇 특화 후속 추천 질문(suggested_questions)'을 정확히 3개 생성하세요.
3. 추천 질문은 반드시 사용자가 챗봇에게 묻는 1인칭 자연스러운 대화체(예: "~알려줘", "~어떻게 돼?")로 작성하고, 다음 4가지 관점을 골고루 참고하여 구성하세요:
   - ① 타 지역 사투리 비교/변환 질문 (예: "이 말을 전라도(혹은 제주도) 사투리로 바꾸면 어떻게 돼?")
   - ② 억양 및 발음 가이드 질문 (예: "이 표현 쓸 때 억양이나 강세는 어떻게 줘야 해?")
   - ③ 어원/유래 및 뉘앙스 질문 (예: "이 사투리 단어의 유래나 정확한 뜻이 뭐야?")
   - ④ 실생활 상황 응용 질문 (예: "식당이나 시장에서 쓸 수 있는 다른 표현도 알려줘")
"""

    def _build_messages(self, text: str, region: str, image_base64: Optional[str] = None) -> list:
        """
        텍스트 및 멀티모달 이미지를 포함한 LangChain 표준 메시지 리스트를 생성합니다.
        """
        system_prompt = self._build_system_instruction(region)
        system_msg = SystemMessage(content=system_prompt)

        user_prompt_text = f"다음 입력 문장을 {region} 사투리로 번역하고 후속 질문을 추천해주세요:\n\n입력 문장: {text}"

        if image_base64:
            # Base64 이미지 포맷 표준화
            if image_base64.startswith("data:"):
                data_url = image_base64
            else:
                data_url = f"data:image/jpeg;base64,{image_base64}"

            # 멀티모달 컨텐츠 블록 구성
            human_content = [
                {"type": "text", "text": user_prompt_text},
                {
                    "type": "image_url",
                    "image_url": {"url": data_url}
                }
            ]
            human_msg = HumanMessage(content=human_content)
        else:
            human_msg = HumanMessage(content=user_prompt_text)

        return [system_msg, human_msg]

    async def translate(
        self,
        text: str,
        region: str,
        image_base64: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None
    ) -> dict:
        """
        LangChain을 이용해 사투리 번역 및 후속 추천 질문을 생성합니다.
        API Key가 없거나 오류 발생 시 안전한 대체(Fallback) 응답을 반환합니다.
        """
        target_model = self.get_model(provider, model)

        # 1. API 키가 없거나 초기화 실패 시 Mock 응답 모드로 동작
        if not target_model:
            await asyncio.sleep(0.5)
            used_provider = provider or self.default_provider
            return {
                "content": f"""선택하신 **{region}** 사투리로 번역된 결과입니다.\n\n"아이고, 밥은 묵읏나? 단디 챙기무라."\n\n```python\n# 안내: 백엔드 .env 파일에 {used_provider.upper()}_API_KEY를 설정해주세요!\nprint("현재는 LangChain 모의 응답 모드입니다.")\n```\n""",
                "suggested_questions": [
                    f"이 표현을 다른 사투리로 바꾸면 어떻게 돼?",
                    f"'{region}' 사투리 억양과 발음 요령을 알려줘",
                    f"이 상황에서 쓸 수 있는 다른 {region} 사투리 표현도 있어?"
                ]
            }

        try:
            # 2. 메시지 생성 및 Structured Output 바인딩
            messages = self._build_messages(text, region, image_base64)
            structured_llm = target_model.with_structured_output(TranslationResponse)

            # 3. 비동기 호출
            response: TranslationResponse = await structured_llm.ainvoke(messages)
            
            # Pydantic 인스턴스 또는 dict 형태 모두 지원
            if isinstance(response, TranslationResponse):
                return {
                    "content": response.content,
                    "suggested_questions": response.suggested_questions
                }
            elif isinstance(response, dict):
                return {
                    "content": response.get("content", ""),
                    "suggested_questions": response.get("suggested_questions", [])
                }
            else:
                return {
                    "content": str(response),
                    "suggested_questions": []
                }
        except Exception as e:
            print(f"⚠️ LangChain API Error ({provider or self.default_provider}): {e}")
            return {
                "content": f"⚠️ LLM 번역 중 오류가 발생했습니다: {str(e)}",
                "suggested_questions": [
                    "다시 번역해줘",
                    "다른 지역 사투리로 시도해줘",
                    "표준어 질문으로 다시 물어볼게"
                ]
            }
