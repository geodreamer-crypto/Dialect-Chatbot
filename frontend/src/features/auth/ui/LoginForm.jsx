import { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

/**
 * 로그인 폼 컴포넌트
 */
export const LoginForm = ({ onLogin, onSuccess, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      await onLogin(email.trim(), password);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Login error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMsg('이메일 또는 비밀번호가 일치하지 않습니다.');
      } else if (err.message?.includes('Email not confirmed')) {
        setErrorMsg('이메일 인증이 완료되지 않았습니다.');
      } else {
        setErrorMsg(err.message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {errorMsg && (
        <div className="auth-error-banner">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="auth-field-group">
        <label className="auth-label">이메일</label>
        <div className="auth-input-wrapper">
          <Mail size={18} className="auth-input-icon" />
          <input
            type="email"
            className="auth-input"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
        </div>
      </div>

      <div className="auth-field-group">
        <label className="auth-label">비밀번호</label>
        <div className="auth-input-wrapper">
          <Lock size={18} className="auth-input-icon" />
          <input
            type="password"
            className="auth-input"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <button type="submit" className="auth-submit-btn" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 size={18} className="spinner" />
            <span>로그인 중...</span>
          </>
        ) : (
          <span>로그인</span>
        )}
      </button>

      <div className="auth-switch-text">
        계정이 없으신가요?{' '}
        <button type="button" className="auth-switch-btn" onClick={onSwitchToSignup} disabled={isLoading}>
          회원가입
        </button>
      </div>
    </form>
  );
};
