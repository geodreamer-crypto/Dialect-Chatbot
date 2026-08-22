import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const MessageBubble = ({ msg, actionSlot, suggestedQuestionsSlot }) => {
  return (
    <div className={`message-row ${msg.role}`}>
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
            {actionSlot && <div className="action-row">{actionSlot}</div>}
            {suggestedQuestionsSlot}
          </div>
        )}
      </div>
    </div>
  );
};
