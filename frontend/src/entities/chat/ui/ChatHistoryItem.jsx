import { Folder } from 'lucide-react';

export const ChatHistoryItem = ({ chat, isActive, onClick }) => {
  return (
    <div 
      className={`history-item ${isActive ? 'active' : ''}`}
      onClick={() => onClick(chat)}
    >
      <Folder size={16} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</span>
    </div>
  );
};
