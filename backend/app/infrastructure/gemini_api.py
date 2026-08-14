from app.application.interfaces import ILLMService
from google import genai
import asyncio

class GeminiService(ILLMService):
    def __init__(self, api_key: str):
        self.api_key = api_key
        if api_key and api_key != "YOUR_GEMINI_API_KEY_HERE":
            self.client = genai.Client(api_key=api_key)
        else:
            self.client = None

    async def translate(self, text: str, region: str) -> str:
        if not self.client:
            await asyncio.sleep(1)
            return f"""선택하신 **{region}** 사투리로 번역된 결과입니다.\n\n"아이고, 밥은 묵읏나? 단디 챙기무라."\n\n```python\n# 안내: 백엔드 .env 파일에 GEMINI_API_KEY를 설정해주세요!\nprint("현재는 모의 응답 모드입니다.")\n```\n"""
        
        try:
            prompt = f"""
            당신은 북한 지역, 경상도, 전라도, 강원도, 제주도에 30년 이상 거주한 완전한 토박이입니다.
            다음 입력된 표준어 문장을 {region} 사투리로 번역해주세요.
            흥미를 더하기 위해 단순한 직역이 아닌 '의역'을 해주시고, 해당 {region} 사투리 특유의 어감이 아주 짙게 묻어나도록 맛깔나게 번역해 주셔야 합니다.
            번역된 사투리 결과만 깔끔하게 출력하고, 다른 부가적인 설명은 절대 하지 마세요.
            
            입력 문장: {text}
            """
            response = await asyncio.to_thread(self.client.models.generate_content, model="gemini-3.5-flash", contents=prompt)
            return response.text
        except Exception as e:
            return f"⚠️ Gemini API 호출 에러가 발생했습니다.\n\n입력하신 API 키가 유효하지 않거나 문제가 있습니다."
