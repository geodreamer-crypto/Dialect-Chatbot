import { MessageBubble } from '../../../entities/message/ui/MessageBubble';
import { PlayTTSButton } from '../../../features/play-tts/ui/PlayTTSButton';
import { ChatInput } from '../../../features/chat-input/ui/ChatInput';
import { SuggestedQuestions } from '../../../features/suggested-questions/ui/SuggestedQuestions';

export const ChatWindow = ({
  messages,
  chatEndRef,
  inputText,
  setInputText,
  selectedRegion,
  setSelectedRegion,
  selectedImage,
  setSelectedImage,
  handleSend,
  isLoading
}) => {
  return (
    <>
      {messages.length === 0 ? (
        <div className="welcome-wrapper">
          <div className="welcome-screen">
            <h1><span className="gradient-text">안녕하세요,</span></h1>
            <h1>어떤 사투리로 번역해 드릴까요?</h1>
            <p>표준어를 입력하시면 선택한 지역의 구수한 사투리와 억양으로 들려드립니다.</p>
          </div>
          <ChatInput 
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
      ) : (
        <>
          <div className="chat-area">
            {messages.map((msg, index) => (
              <MessageBubble 
                key={msg.id} 
                msg={msg} 
                actionSlot={
                  msg.role === 'bot' && (
                    <PlayTTSButton content={msg.content} region={msg.region} />
                  )
                }
                suggestedQuestionsSlot={
                  index === messages.length - 1 && msg.role === 'bot' && msg.suggested_questions?.length > 0 ? (
                    <SuggestedQuestions
                      questions={msg.suggested_questions}
                      onSelectQuestion={(question) => handleSend(question)}
                      disabled={isLoading}
                    />
                  ) : null
                }
              />
            ))}
            {isLoading && (
              <div className="message-wrapper bot" style={{ display: 'flex', gap: '12px', alignItems: 'center', opacity: 0.8 }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  사투리로 번역 중입니다... 💬
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <ChatInput 
            inputText={inputText}
            setInputText={setInputText}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            handleSend={handleSend}
            isLoading={isLoading}
          />
        </>
      )}
    </>
  );
};
