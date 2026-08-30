import { Menu, LogIn, MessageSquare } from 'lucide-react';
import { CreateChatButton } from '../../../features/create-chat/ui/CreateChatButton';
import { ChatHistoryItem } from '../../../entities/chat/ui/ChatHistoryItem';

export const Sidebar = ({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  handleNewChat, 
  history = [], 
  currentChatId, 
  loadChat,
  onDeleteChat,
  isLoggedIn = false,
  onOpenLogin
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
        <div className="history-title">최근 대화 기록</div>

        {!isLoggedIn ? (
          <div className="sidebar-guest-card">
            <MessageSquare size={28} className="sidebar-guest-icon" />
            <div className="sidebar-guest-text">
              로그인하면 대화 기록이 자동으로 저장되고 언제든 다시 볼 수 있습니다.
            </div>
            {onOpenLogin && (
              <button className="sidebar-login-btn" onClick={onOpenLogin}>
                <LogIn size={15} />
                <span>로그인하기</span>
              </button>
            )}
          </div>
        ) : history.length === 0 ? (
          <div className="sidebar-empty-text">
            저장된 대화 기록이 없습니다.
          </div>
        ) : (
          history.map((chat) => (
            <ChatHistoryItem 
              key={chat.id} 
              chat={chat} 
              isActive={currentChatId === chat.id} 
              onClick={loadChat}
              onDelete={onDeleteChat}
            />
          ))
        )}
      </div>
    </div>
  );
};
