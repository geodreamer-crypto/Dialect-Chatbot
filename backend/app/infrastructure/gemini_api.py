from app.application.interfaces import ILLMService
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncio
import json

class GeminiTranslationResponse(BaseModel):
    content: str = Field(
        description="선택한 지역의 구수한 사투리로 맛깔나게 의역 및 묘사된 번역 결과 본문 (마크다운 포맷 가능)"
    )
    suggested_questions: List[str] = Field(
        description="사용자가 이어서 질문할 만한 사투리 봇 특화 후속 추천 질문 3개 (타 지역 사투리 변환, 억양/발음 팁, 어원/유래, 실생활 표현 등)",
        max_items=3
    )

class GeminiService(ILLMService):
    def __init__(self, api_key: str):
        self.api_key = api_key
        if api_key and api_key != "YOUR_GEMINI_API_KEY_HERE":
            self.client = genai.Client(api_key=api_key)
        else:
            self.client = None

    async def translate(self, text: str, region: str, image_base64: str = None) -> dict:
        if not self.client:
            await asyncio.sleep(1)
            return {
                "content": f"""선택하신 **{region}** 사투리로 번역된 결과입니다.\n\n"아이고, 밥은 묵읏나? 단디 챙기무라."\n\n```python\n# 안내: 백엔드 .env 파일에 GEMINI_API_KEY를 설정해주세요!\nprint("현재는 모의 응답 모드입니다.")\n```\n""",
                "suggested_questions": [
                    f"이 표현을 다른 사투리로 바꾸면 어떻게 돼?",
                    f"'{region}' 사투리 억양과 발음 요령을 알려줘",
                    f"이 상황에서 쓸 수 있는 다른 {region} 사투리 표현도 있어?"
                ]
            }
        
        try:
            system_instruction = f"""
            당신은 북한 지역, 경상도, 전라도, 강원도, 제주도 등 전국의 사투리에 능통한 30년 토박이 사투리 전문가입니다.

            [역할 및 지침]
            1. 입력된 표준어 문장과 (주어진 경우) 사진을 바탕으로 상황을 {region} 사투리로 맛깔나게 의역 및 묘사하세요. 단순 직역이 아니라 해당 {region} 사투리 특유의 어감과 뉘앙스가 짙게 묻어나야 합니다.
            2. 답변(content)과 함께, 사용자가 이어서 흥미롭게 물어볼 만한 '사투리 봇 특화 후속 추천 질문(suggested_questions)'을 정확히 3개 생성하세요.
            3. 추천 질문은 반드시 사용자가 챗봇에게 묻는 1인칭 자연스러운 대화체(예: "~알려줘", "~어떻게 돼?")로 작성하고, 다음 4가지 관점을 골고루 참고하여 구성하세요:
               - ① 타 지역 사투리 비교/변환 질문 (예: "이 말을 전라도(혹은 제주도) 사투리로 바꾸면 어떻게 돼?")
               - ② 억양 및 발음 가이드 질문 (예: "이 표현 쓸 때 억양이나 강세는 어떻게 줘야 해?")
               - ③ 어원/유래 및 뉘앙스 질문 (예: "이 사투리 단어의 유래나 정확한 뜻이 뭐야?")
               - ④ 실생활 상황 응용 질문 (예: "식당이나 시장에서 쓸 수 있는 다른 표현도 알려줘")
            """

            user_prompt = f"다음 입력 문장을 {region} 사투리로 번역하고 후속 질문을 추천해주세요:\n\n입력 문장: {text}"
            contents = [user_prompt]
            
            if image_base64:
                import base64
                try:
                    if "base64," in image_base64:
                        mime_type = image_base64.split(';')[0].split(':')[1]
                        image_b64_data = image_base64.split("base64,")[1]
                    else:
                        mime_type = "image/jpeg"
                        image_b64_data = image_base64
                    
                    image_bytes = base64.b64decode(image_b64_data)
                    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                    contents = [image_part, user_prompt]
                except Exception as e:
                    print(f"Image processing error: {e}")

            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=GeminiTranslationResponse,
                temperature=0.7
            )

            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model="gemini-3.6-flash",
                contents=contents,
                config=config
            )

            # Structured Output 파싱
            parsed_data = GeminiTranslationResponse.model_validate_json(response.text)
            return {
                "content": parsed_data.content,
                "suggested_questions": parsed_data.suggested_questions
            }
        except Exception as e:
            print(f"⚠️ Gemini API Error: {e}")
            # Fallback: 만약 API 에러 시에도 최소한의 안전한 구조 반환
            return {
                "content": f"⚠️ Gemini API 호출 중 오류가 발생했습니다: {str(e)}",
                "suggested_questions": [
                    "다시 번역해줘",
                    "다른 지역 사투리로 시도해줘",
                    "표준어 질문으로 다시 물어볼게"
                ]
            }
