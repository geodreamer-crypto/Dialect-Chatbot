import { Folder, Trash2 } from 'lucide-react';

export const ChatHistoryItem = ({ chat, isActive, onClick, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(chat.id);
    }
  };

  return (
    <div 
      className={`history-item ${isActive ? 'active' : ''}`}
      onClick={() => onClick(chat)}
    >
      <Folder size={16} className="history-icon" />
      <span className="history-title-text">{chat.title}</span>
      <button 
        className="history-delete-btn" 
        onClick={handleDelete}
        title="대화 삭제"
        aria-label="대화 삭제"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
