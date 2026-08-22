import { useState, useRef } from 'react';
import { Image as ImageIcon, Mic, Send, X } from 'lucide-react';

export const ChatInput = ({ 
  inputText, 
  setInputText, 
  selectedRegion, 
  setSelectedRegion,
  selectedImage,
  setSelectedImage,
  handleSend,
  isLoading 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageClick = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMicClick = () => {
    if (isLoading || isRecording) return; // Prevent multiple starts

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("현재 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <div className="input-container">
      {selectedImage && (
        <div className="image-preview" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '8px', borderRadius: '12px', width: 'fit-content' }}>
          <img src={selectedImage} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
          <button onClick={removeImage} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="input-box">
        <select 
          className="region-select"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          disabled={isLoading}
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
          placeholder={isLoading ? "사투리로 번역하는 중입니다..." : isRecording ? "듣고 있습니다..." : "여기에 표준어를 입력해주세요..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading) handleSend();
          }}
        />
        
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />

        <div className="input-actions">
          <button className="icon-btn" onClick={handleImageClick} disabled={isLoading}>
            <ImageIcon size={20} />
          </button>
          <button className={`icon-btn ${isRecording ? 'recording' : ''}`} onClick={handleMicClick} style={isRecording ? { color: '#d96570' } : {}} disabled={isLoading}>
            <Mic size={20} />
          </button>
          <button 
            className={`icon-btn send ${((!inputText.trim() && !selectedImage) || isLoading) ? 'disabled' : ''}`}
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
