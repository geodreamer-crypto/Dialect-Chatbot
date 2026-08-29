import { Menu } from 'lucide-react';
import { CreateChatButton } from '../../../features/create-chat/ui/CreateChatButton';
import { ChatHistoryItem } from '../../../entities/chat/ui/ChatHistoryItem';

export const Sidebar = ({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  handleNewChat, 
  history, 
  currentChatId, 
  loadChat,
  onDeleteChat
}) => {
  return (
    <div className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu size={24} />
        </button>
      </div>
      
      <CreateChatButton onClick={handleNewChat} />

      <div className="history-list">
        <div className="history-title">최근 대화 기록 (DB)</div>
        {history.map((chat) => (
          <ChatHistoryItem 
            key={chat.id} 
            chat={chat} 
            isActive={currentChatId === chat.id} 
            onClick={loadChat}
            onDelete={onDeleteChat}
          />
        ))}
      </div>
    </div>
  );
};
