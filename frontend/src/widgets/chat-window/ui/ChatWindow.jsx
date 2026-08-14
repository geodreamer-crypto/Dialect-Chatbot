import { MessageBubble } from '../../../entities/message/ui/MessageBubble';
import { PlayTTSButton } from '../../../features/play-tts/ui/PlayTTSButton';
import { ChatInput } from '../../../features/chat-input/ui/ChatInput';

export const ChatWindow = ({
  messages,
  chatEndRef,
  inputText,
  setInputText,
  selectedRegion,
  setSelectedRegion,
  handleSend
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
            handleSend={handleSend}
          />
        </div>
      ) : (
        <>
          <div className="chat-area">
            {messages.map(msg => (
              <MessageBubble 
                key={msg.id} 
                msg={msg} 
                actionSlot={
                  msg.role === 'bot' && (
                    <PlayTTSButton content={msg.content} region={msg.region} />
                  )
                }
              />
            ))}
            <div ref={chatEndRef} />
          </div>
          <ChatInput 
            inputText={inputText}
            setInputText={setInputText}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            handleSend={handleSend}
          />
        </>
      )}
    </>
  );
};
