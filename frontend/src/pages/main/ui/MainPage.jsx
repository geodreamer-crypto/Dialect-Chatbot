import { useState, useRef, useEffect } from 'react';
import { Sidebar } from '../../../widgets/sidebar/ui/Sidebar';
import { ChatWindow } from '../../../widgets/chat-window/ui/ChatWindow';
import { fetchHistory, createChat } from '../../../entities/chat/api/chatApi';
import { fetchMessages } from '../../../entities/message/api/messageApi';
import { API_BASE_URL } from '../../../shared/api/config';

export const MainPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('경상도');
  const [selectedImage, setSelectedImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(1);
  const chatEndRef = useRef(null);

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
    setCurrentChatId(null);
  };

  const loadChat = async (chat) => {
    setCurrentChatId(chat.id);
    const msgs = await fetchMessages(chat.id);
    setMessages(msgs || []);
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;
    
    const contentText = selectedImage ? `[이미지 첨부됨] ${inputText}` : inputText;
    const newUserMsg = { id: Date.now(), role: 'user', content: contentText };
    setMessages(prev => [...prev, newUserMsg]);
    
    const imageToSend = selectedImage;
    setInputText('');
    setSelectedImage(null);

    let targetChatId = currentChatId;
    if (!targetChatId) {
      const newChat = await createChat(inputText.substring(0, 20) || "새로운 사투리 번역");
      if (newChat) {
        targetChatId = newChat.id;
        setCurrentChatId(targetChatId);
        setHistory(prev => [newChat, ...prev]);
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId: targetChatId, 
          text: inputText, 
          region: selectedRegion,
          image_base64: imageToSend
        })
      });
      const data = await response.json();
      const mockResponse = data.content;

      const newBotMsg = { 
        id: Date.now() + 1, 
        role: 'bot', 
        content: mockResponse || "응답을 받지 못했습니다. 백엔드 서버 상태를 확인해주세요.", 
        region: selectedRegion 
      };
      setMessages(prev => [...prev, newBotMsg]);
      
      const updatedHistory = await fetchHistory();
      if (Array.isArray(updatedHistory)) {
        setHistory(updatedHistory);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', content: "에러가 발생했습니다.", region: selectedRegion }]);
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        handleNewChat={handleNewChat}
        history={history}
        currentChatId={currentChatId}
        loadChat={loadChat}
      />
      <div className="main-content">
        <div className="header">
          <div className="header-title">
            <span>Jemini </span>
            <span style={{color: 'var(--text-primary)', fontSize: '16px', fontWeight: '400'}}>사투리 봇</span>
          </div>
        </div>
        <ChatWindow 
          messages={messages}
          chatEndRef={chatEndRef}
          inputText={inputText}
          setInputText={setInputText}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          handleSend={handleSend}
        />
      </div>
    </div>
  );
};
