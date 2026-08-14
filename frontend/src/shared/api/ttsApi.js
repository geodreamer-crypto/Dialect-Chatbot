import { API_BASE_URL } from './config';

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
