import { MessageSquare } from 'lucide-react';

export const ChatHistoryItem = ({ chat, isActive, onClick }) => {
  return (
    <div 
      className={`history-item ${isActive ? 'active' : ''}`}
      onClick={() => onClick(chat)}
    >
      <MessageSquare size={16} />
      <span>{chat.title}</span>
    </div>
  );
};
