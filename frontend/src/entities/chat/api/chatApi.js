import { API_BASE_URL } from '../../../shared/api/config';

export const fetchHistory = async (userId = null) => {
  // 비로그인 사용자이거나 userId가 없으면 타인의 대화 기록을 불러오지 않고 즉시 빈 배열 반환
  if (!userId) {
    return [];
  }
  try {
    const response = await fetch(`${API_BASE_URL}/history?user_id=${encodeURIComponent(userId)}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};

export const createChat = async (title, userId = null, initialMessages = null) => {
  try {
    const payload = { title };
    if (userId) {
      payload.user_id = userId;
    }
    if (Array.isArray(initialMessages) && initialMessages.length > 0) {
      payload.initial_messages = initialMessages.map(m => ({
        role: m.role || 'user',
        content: m.content || '',
        region: m.region || '경상도'
      }));
    }
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error("Error creating chat:", error);
    return null;
  }
};

export const deleteChat = async (chatId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting chat:", error);
    return null;
  }
};

