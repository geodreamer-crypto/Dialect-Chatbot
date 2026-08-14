import { Plus } from 'lucide-react';

export const CreateChatButton = ({ onClick }) => {
  return (
    <button className="new-chat-btn" onClick={onClick}>
      <Plus size={20} />
      <span className="new-chat-text">새 채팅</span>
    </button>
  );
};
