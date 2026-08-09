import { useState, useRef, useEffect } from 'react';
import { 
  Menu, Plus, MessageSquare, Settings, HelpCircle, 
  Send, Image as ImageIcon, Mic, Sparkles, Volume2, History
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchTranslation, playTTS, fetchHistory, createChat, fetchMessages } from './services/apiServices';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('경상도');
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(1);
  const chatEndRef = useRef(null);

  // 컴포넌트 마운트 시 과거 대화 내역(History) DB에서 불러오기
  useEffect(() => {
    const loadHistory = async () => {
      const data = await fetchHistory();
      if (Array.isArray(data)) {
        setHistory(data);
        if (data.length > 0) {
          setCurrentChatId(data[0].id);
          const msgs = await fetchMessages(data[0].id);
          setMessages(msgs || []);
        }
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = async () => {
    setMessages([]);
    const newChat = await createChat("새로운 사투리 번역");
    if (newChat) {
      setCurrentChatId(newChat.id);
      setHistory(prev => [newChat, ...prev]);
    }
  };

  const loadChat = async (chat) => {
    setCurrentChatId(chat.id);
    const msgs = await fetchMessages(chat.id);
    setMessages(msgs || []);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const newUserMsg = { id: Date.now(), role: 'user', content: inputText };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');

    try {
      const mockResponse = await fetchTranslation(inputText, selectedRegion, currentChatId);
      const newBotMsg = { 
        id: Date.now() + 1, 
        role: 'bot', 
        content: mockResponse || "응답을 받지 못했습니다. 백엔드 서버 상태를 확인해주세요.", 
        region: selectedRegion 
      };
      setMessages(prev => [...prev, newBotMsg]);
      
      // 대화내역(제목) 갱신
      const updatedHistory = await fetchHistory();
      if (Array.isArray(updatedHistory)) {
        setHistory(updatedHistory);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', content: "에러가 발생했습니다.", region: selectedRegion }]);
    }
  };

  const handleTTS = (text, region) => {
    playTTS(text, region);
  };

  // 입력창 컴포넌트 분리
  const renderInputArea = () => (
    <div className="input-container">
      <div className="input-box">
        <select 
          className="region-select"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
        >
          <option value="강원도">강원도</option>
          <option value="북한">북한</option>
          <option value="전라도">전라도</option>
          <option value="경상도">경상도</option>
          <option value="제주도">제주도</option>
        </select>
        
        <input 
          type="text" 
          className="input-field" 
          placeholder="여기에 표준어를 입력해주세요..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        
        <div className="input-actions">
          <button className="icon-btn">
            <ImageIcon size={20} />
          </button>
          <button className="icon-btn">
            <Mic size={20} />
          </button>
          <button 
            className={`icon-btn send ${!inputText.trim() ? 'disabled' : ''}`}
            onClick={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu size={24} />
          </button>
        </div>
        
        <button className="new-chat-btn" onClick={handleNewChat}>
          <Plus size={20} />
          <span className="new-chat-text">새 채팅</span>
        </button>

        <div className="history-list">
          <div className="history-title">최근 대화 기록 (DB)</div>
          {history.map((chat) => (
            <div 
              key={chat.id} 
              className={`history-item ${currentChatId === chat.id ? 'active' : ''}`}
              onClick={() => loadChat(chat)}
            >
              <MessageSquare size={16} />
              <span>{chat.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <div className="header-title">
            <span>Gemini </span>
            <span style={{color: 'var(--text-primary)', fontSize: '16px', fontWeight: '400'}}>사투리 봇</span>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="welcome-wrapper">
            <div className="welcome-screen">
              <h1><span className="gradient-text">안녕하세요,</span></h1>
              <h1>어떤 사투리로 번역해 드릴까요?</h1>
              <p>표준어를 입력하시면 선택한 지역의 구수한 사투리와 억양으로 들려드립니다.</p>
            </div>
            {renderInputArea()}
          </div>
        ) : (
          <>
            <div className="chat-area">
              {messages.map(msg => (
                <div key={msg.id} className={`message-row ${msg.role}`}>
                  {msg.role === 'bot' && (
                    <div className="bot-avatar">
                      <Sparkles />
                    </div>
                  )}
                  <div className="message-content">
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="message-body">
                        <div className="markdown-body">
                          <ReactMarkdown>
                            {String(msg.content || '')}
                          </ReactMarkdown>
                        </div>
                        <div className="action-row">
                          <button 
                            className="action-btn" 
                            onClick={() => handleTTS(msg.content, msg.region)}
                            title="TTS 듣기"
                          >
                            <Volume2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {renderInputArea()}
          </>
        )}
      </div>
    </div>
  );
}
