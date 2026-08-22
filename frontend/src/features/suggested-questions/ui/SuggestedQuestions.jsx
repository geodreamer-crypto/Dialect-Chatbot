import { Sparkles } from 'lucide-react';

export const SuggestedQuestions = ({ questions, onSelectQuestion, disabled = false }) => {
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return null;
  }

  return (
    <div className="suggested-questions-container">
      <div className="suggested-header">
        <Sparkles size={14} className="suggested-icon" />
        <span>이어서 이런 질문은 어떠세요?</span>
      </div>
      <div className="suggested-buttons-wrapper">
        {questions.map((question, index) => (
          <button
            key={index}
            type="button"
            className="suggested-question-btn"
            onClick={() => onSelectQuestion && onSelectQuestion(question)}
            disabled={disabled}
            title={question}
          >
            <span className="question-bullet">💬</span>
            <span className="question-text">{question}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
