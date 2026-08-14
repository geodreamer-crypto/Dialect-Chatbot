import { Image as ImageIcon, Mic, Send } from 'lucide-react';

export const ChatInput = ({ 
  inputText, 
  setInputText, 
  selectedRegion, 
  setSelectedRegion, 
  handleSend 
}) => {
  return (
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
};
