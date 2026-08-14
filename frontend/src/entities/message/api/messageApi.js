import { API_BASE_URL } from '../../../shared/api/config';

export const fetchMessages = async (chatId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};
