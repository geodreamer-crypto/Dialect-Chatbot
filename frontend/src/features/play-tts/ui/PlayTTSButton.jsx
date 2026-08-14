import { Volume2 } from 'lucide-react';
import { playTTS } from '../../../shared/api/ttsApi';

export const PlayTTSButton = ({ content, region }) => {
  const handleTTS = () => {
    playTTS(content, region);
  };

  return (
    <button 
      className="action-btn" 
      onClick={handleTTS}
      title="TTS 듣기"
    >
      <Volume2 size={18} />
    </button>
  );
};
