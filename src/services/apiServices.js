const API_BASE_URL = 'http://localhost:8000/api';

// 1. 번역 API 호출 (프론트 -> 백엔드 -> 외부 LLM)
export const fetchTranslation = async (text, region, chatId = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, text, region })
    });
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Backend API Error:", error);
    return "서버와 연결할 수 없습니다. (백엔드 서버가 실행 중인지 확인하세요)";
  }
};

// 2. TTS 음성 호출
export const playTTS = async (text, region) => {
  try {
    // 백엔드 TTS 핑(Ping) 테스트
    await fetch(`${API_BASE_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, region })
    });
  } catch (err) {
    console.log("TTS Backend connection issue:", err);
  }

  // [임시] 브라우저 내장 Web Speech API(표준어 억양) 유지
  if ('speechSynthesis' in window) {
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
  } else {
    alert('이 브라우저는 기본 TTS 기능을 지원하지 않습니다.');
  }
};

// 3. 채팅 이력 가져오기 (DB 연동)
export const fetchHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/history`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};

// 4. 새 채팅방 생성 (DB 연동)
export const createChat = async (title) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    return await response.json();
  } catch (error) {
    console.error("Error creating chat:", error);
    return null;
  }
};

// 5. 특정 채팅방의 메시지 가져오기 (DB 연동)
export const fetchMessages = async (chatId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};
