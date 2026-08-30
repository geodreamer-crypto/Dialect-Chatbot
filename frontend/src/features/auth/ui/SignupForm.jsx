import { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * 회원가입 폼 컴포넌트
 */
export const SignupForm = ({ onSignup, onSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    setErrorMsg('');
    setSuccessNotice('');
    setIsLoading(true);

    try {
      const data = await onSignup(email.trim(), password);
      // Supabase 회원가입 시 이메일 확인 설정에 따라 바로 로그인되거나 확인 메일 발송됨
      if (data?.user && data?.session) {
        if (onSuccess) onSuccess();
      } else if (data?.user && !data?.session) {
        setSuccessNotice('회원가입이 완료되었습니다! 가입 승인 또는 로그인해주세요.');
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Signup error:', err);
      if (err.message?.includes('User already registered')) {
        setErrorMsg('이미 등록된 이메일 계정입니다.');
      } else if (err.message?.includes('Password should be at least')) {
        setErrorMsg('비밀번호는 6자리 이상이어야 합니다.');
      } else {
        setErrorMsg(err.message || '회원가입 중 오류가 발생했습니다.');
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

      {successNotice && (
        <div className="auth-success-banner">
          <CheckCircle2 size={16} />
          <span>{successNotice}</span>
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
        <label className="auth-label">비밀번호 (6자 이상)</label>
        <div className="auth-input-wrapper">
          <Lock size={18} className="auth-input-icon" />
          <input
            type="password"
            className="auth-input"
            placeholder="비밀번호 입력 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="auth-field-group">
        <label className="auth-label">비밀번호 확인</label>
        <div className="auth-input-wrapper">
          <Lock size={18} className="auth-input-icon" />
          <input
            type="password"
            className="auth-input"
            placeholder="비밀번호 다시 입력"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <button type="submit" className="auth-submit-btn" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 size={18} className="spinner" />
            <span>가입 처리 중...</span>
          </>
        ) : (
          <span>무료 회원가입</span>
        )}
      </button>

      <div className="auth-switch-text">
        이미 계정이 있으신가요?{' '}
        <button type="button" className="auth-switch-btn" onClick={onSwitchToLogin} disabled={isLoading}>
          로그인
        </button>
      </div>
    </form>
  );
};
