import { useState, useRef, useEffect } from 'react';
import { Sidebar } from '../../../widgets/sidebar/ui/Sidebar';
import { ChatWindow } from '../../../widgets/chat-window/ui/ChatWindow';
import { ModelSelector } from '../../../features/model-selector/ui/ModelSelector';
import { AVAILABLE_MODELS } from '../../../features/model-selector/model/models';
import { fetchHistory, createChat, deleteChat } from '../../../entities/chat/api/chatApi';
import { fetchMessages } from '../../../entities/message/api/messageApi';
import { API_BASE_URL } from '../../../shared/api/config';
import { useAuth } from '../../../entities/user/model/useAuth';
import { UserBadge } from '../../../entities/user/ui/UserBadge';
import { AuthModal } from '../../../features/auth/ui/AuthModal';

export const MainPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('경상도');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 인증 및 게스트 세션 질문 수 관리 훅
  const {
    user,
    isLoggedIn,
    guestCount,
    maxFreeQuestions,
    remainingFreeQuestions,
    canSendQuestion,
    incrementGuestCount,
    loginWithGoogle,
    popPendingMessage,
    login,
    signup,
    logout
  } = useAuth();

  // 로그인 모달 및 로그인 후 자동 전송을 위한 보류 메시지 상태
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);

  const chatEndRef = useRef(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // 로그인 상태 및 사용자 변경 시 대화 기록 동기화
  useEffect(() => {
    let isCancelled = false;

    const loadUserHistory = async () => {
      if (isLoggedIn && user?.id) {
        const data = await fetchHistory(user.id);
        if (isCancelled) return;

        setHistory(Array.isArray(data) ? data : []);

        // 게스트 상태에서 나눈 대화가 현재 화면에 남아있는 경우 초기화하지 않고 온전히 보존
        if (messagesRef.current.length > 0 && !currentChatId) {
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          const firstChatId = data[0].id;
          setCurrentChatId(firstChatId);
          const msgs = await fetchMessages(firstChatId);
          if (!isCancelled) {
            setMessages(msgs || []);
          }
        } else {
          setCurrentChatId(null);
          setMessages([]);
        }
      } else {
        // 비로그인 상태: DB의 타 사용자 대화 기록이 노출되지 않도록 완전히 비움
        setHistory([]);
        setCurrentChatId(null);
        setMessages([]);
      }
    };

    loadUserHistory();

    return () => {
      isCancelled = true;
    };
  }, [isLoggedIn, user?.id]);

  const handleSendRef = useRef(null);

  // Google OAuth 리다이렉트 후 복귀 시 보류된 질문 자동 전송 복원
  useEffect(() => {
    if (isLoggedIn) {
      const savedPending = popPendingMessage();
      if (savedPending && savedPending.text) {
        if (savedPending.image) setSelectedImage(savedPending.image);
        if (savedPending.region) setSelectedRegion(savedPending.region);
        setTimeout(() => {
          handleSendRef.current?.(savedPending.text);
        }, 300);
      }
    }
  }, [isLoggedIn, popPendingMessage]);

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

  const handleDeleteChat = async (chatId) => {
    try {
      const res = await deleteChat(chatId);
      if (res && res.success !== false) {
        setHistory(prev => prev.filter(c => c.id !== chatId));
        if (currentChatId === chatId) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  /**
   * 메시지 전송 핸들러
   * - 비로그인(게스트) 사용자는 메모리 상에서 2회 무료 체험을 지원합니다.
   * - 로그인 사용자는 이전 게스트 대화가 있을 경우 일괄 포함하여 대화방을 생성하고 DB에 안전하게 보관합니다.
   */
  const handleSend = async (overrideText = null) => {
    const userText = typeof overrideText === 'string' ? overrideText.trim() : inputText.trim();
    if ((!userText && !selectedImage) || isLoading) return;

    // 1. 게스트 3번째 질문 인터셉트 검증
    if (!isLoggedIn && !canSendQuestion()) {
      setPendingMessage({
        text: userText,
        image: overrideText ? null : selectedImage,
        region: selectedRegion
      });
      setIsAuthModalOpen(true);
      return;
    }

    // 2. 비로그인 사용자라면 게스트 질문 카운트 증가
    if (!isLoggedIn) {
      incrementGuestCount();
    }
    
    const contentText = (selectedImage && !overrideText) ? `[이미지 첨부됨] ${userText}` : userText;
    const newUserMsg = { id: Date.now(), role: 'user', content: contentText, region: selectedRegion };
    const prevMessagesSnapshot = [...messages];
    setMessages(prev => [...prev, newUserMsg]);
    
    const imageToSend = overrideText ? null : selectedImage;
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    let targetChatId = currentChatId;

    // 3. 로그인 사용자이고 활성 대화방이 없으면 이전 게스트 대화까지 포함하여 새 대화방 DB 생성
    if (isLoggedIn && user?.id && !targetChatId) {
      try {
        const firstUserMsg = prevMessagesSnapshot.find(m => m.role === 'user');
        const rawTitle = firstUserMsg ? firstUserMsg.content : userText;
        const cleanTitle = rawTitle.replace(/^\[이미지 첨부됨\]\s*/, '').substring(0, 20) || "새로운 사투리 번역";
        
        // 이전 게스트 대화 목록을 함께 전달하여 DB에 일괄 저장
        const newChat = await createChat(cleanTitle, user.id, prevMessagesSnapshot);
        if (newChat && newChat.id) {
          targetChatId = newChat.id;
          setCurrentChatId(targetChatId);
          setHistory(prev => [newChat, ...prev.filter(c => c.id !== newChat.id)]);
        }
      } catch (err) {
        console.warn("대화방 생성 일시적 지연 (임시 세션으로 번역 진행):", err);
      }
    }

    try {
      // 게스트인 경우 targetChatId는 0으로 전송 (DB 저장 방지 및 실시간 번역만 수행)
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId: targetChatId || 0, 
          text: userText, 
          region: selectedRegion,
          image_base64: imageToSend,
          provider: selectedModel?.provider,
          model: selectedModel?.model
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
      
      // 로그인 사용자만 히스토리 갱신
      if (isLoggedIn && user?.id) {
        const updatedHistory = await fetchHistory(user.id);
        if (Array.isArray(updatedHistory)) {
          setHistory(updatedHistory);
        }
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
  handleSendRef.current = handleSend;

  /**
   * 로그인 또는 회원가입 성공 시 처리
   * 보류(pending)된 3번째 질문이 있을 경우 자동으로 전송을 재개합니다.
   */
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (pendingMessage) {
      const messageToResend = pendingMessage.text;
      if (pendingMessage.image) {
        setSelectedImage(pendingMessage.image);
      }
      setPendingMessage(null);
      // 로그인 완료 상태에서 즉시 질문 자동 전송
      setTimeout(() => {
        handleSend(messageToResend);
      }, 100);
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
        onDeleteChat={handleDeleteChat}
        isLoggedIn={isLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
      />
      <div className="main-content">
        <div className="header">
          <div className="header-title">
            <span>Jemini </span>
            <span style={{color: 'var(--text-primary)', fontSize: '16px', fontWeight: '400'}}>사투리 봇</span>
          </div>
          
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ModelSelector 
              selectedModelId={selectedModel.id}
              onSelectModel={setSelectedModel}
              disabled={isLoading}
            />
            <UserBadge 
              isLoggedIn={isLoggedIn}
              user={user}
              remainingFreeQuestions={remainingFreeQuestions}
              maxFreeQuestions={maxFreeQuestions}
              onOpenLogin={() => setIsAuthModalOpen(true)}
              onLogout={logout}
            />
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

      {/* Google OAuth & 이메일 인증 모달 */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginWithGoogle={() => loginWithGoogle(pendingMessage)}
        onLogin={login}
        onSignup={signup}
        onSuccess={handleAuthSuccess}
        isLimitReached={!isLoggedIn && guestCount >= maxFreeQuestions}
      />
    </div>
  );
};
