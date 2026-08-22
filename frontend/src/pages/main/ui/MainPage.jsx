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
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      const data = await fetchHistory();
      if (Array.isArray(data) && data.length > 0) {
        setHistory(data);
        setCurrentChatId(data[0].id);
        const msgs = await fetchMessages(data[0].id);
        setMessages(msgs || []);
      } else {
        setHistory([]);
        setCurrentChatId(null);
        setMessages([]);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setInputText('');
    setSelectedImage(null);
  };

  const loadChat = async (chat) => {
    if (!chat || !chat.id) return;
    setCurrentChatId(chat.id);
    const msgs = await fetchMessages(chat.id);
    setMessages(msgs || []);
  };

  const handleSend = async (overrideText = null) => {
    const userText = typeof overrideText === 'string' ? overrideText.trim() : inputText.trim();
    if ((!userText && !selectedImage) || isLoading) return;
    
    const contentText = (selectedImage && !overrideText) ? `[이미지 첨부됨] ${userText}` : userText;
    const newUserMsg = { id: Date.now(), role: 'user', content: contentText };
    setMessages(prev => [...prev, newUserMsg]);
    
    const imageToSend = overrideText ? null : selectedImage;
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    let targetChatId = currentChatId;
    if (!targetChatId) {
      try {
        const titleText = userText.substring(0, 20) || "새로운 사투리 번역";
        const newChat = await createChat(titleText);
        if (newChat && newChat.id) {
          targetChatId = newChat.id;
          setCurrentChatId(targetChatId);
          setHistory(prev => [newChat, ...prev.filter(c => c.id !== newChat.id)]);
        } else {
          throw new Error("채팅방 생성 실패");
        }
      } catch (err) {
        console.error("Failed to create chat:", err);
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          role: 'bot', 
          content: "⚠️ 채팅방을 생성하지 못했습니다. 백엔드 서버 연결을 확인해주세요.", 
          region: selectedRegion 
        }]);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId: targetChatId, 
          text: userText, 
          region: selectedRegion,
          image_base64: imageToSend
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botResponse = data.content || "응답을 받지 못했습니다.";
      const suggestedQuestions = Array.isArray(data.suggested_questions) ? data.suggested_questions : [];

      const newBotMsg = { 
        id: data.id || Date.now() + 1, 
        role: 'bot', 
        content: botResponse, 
        region: selectedRegion,
        suggested_questions: suggestedQuestions
      };
      setMessages(prev => [...prev, newBotMsg]);
      
      const updatedHistory = await fetchHistory();
      if (Array.isArray(updatedHistory)) {
        setHistory(updatedHistory);
      }
    } catch (e) {
      console.error("Chat API error:", e);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'bot', 
        content: "⚠️ 서버 통신에 실패했습니다. 백엔드 서버(FastAPI)가 실행 중인지 확인해주세요.", 
        region: selectedRegion 
      }]);
    } finally {
      setIsLoading(false);
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
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
