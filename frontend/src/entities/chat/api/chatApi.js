import { API_BASE_URL } from '../../../shared/api/config';

export const fetchHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/history`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};

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

