import { useState } from 'react';
import { Sparkles, MessageSquareHeart, Loader2, ArrowRight, UserCheck } from 'lucide-react';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import './AuthModal.css';

/**
 * Google 공식 컬러 아이콘 SVG
 */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

/**
 * 인증(Google 원클릭 & 이메일 & 빠른 계정) 통합 모달
 */
export const AuthModal = ({ 
  isOpen, 
  onClose, 
  onLoginWithGoogle,
  onLogin, 
  onSignup, 
  onSuccess,
  isLimitReached = false 
}) => {
  const [activeTab, setActiveTab] = useState('google'); // 'google' | 'email_login' | 'email_signup'
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // 실제 공식 Google OAuth 로그인 진행
  const handleGoogleOAuthLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setGoogleError('');
      if (onLoginWithGoogle) {
        await onLoginWithGoogle();
      }
    } catch (err) {
      console.error('Google OAuth login error:', err);
      setGoogleError(err.message || 'Google 계정 로그인 중 오류가 발생했습니다.');
      setIsGoogleLoading(false);
    }
  };

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="auth-modal-content">
        {/* 모달 상단 비주얼 헤더 */}
        <div className="auth-header-hero">
          <div className="auth-hero-icon">
            <MessageSquareHeart size={26} />
          </div>
          <h2 className="auth-hero-title">
            <span className="gradient-text">Jemini</span> 사투리 봇
          </h2>
          {isLimitReached ? (
            <div className="auth-limit-alert">
              <Sparkles size={16} />
              <span>비회원 무료 질문(2회)이 모두 소진되었습니다.<br />Google 계정 또는 이메일로 로그인하고 무제한 대화를 즐겨보세요!</span>
            </div>
          ) : (
            <p className="auth-hero-desc">
              로그인하시면 대화 기록 보존 및 무제한 사투리 번역이 가능합니다.
            </p>
          )}
        </div>

        {googleError && (
          <div className="auth-error-banner">
            <span>{googleError}</span>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab-btn ${activeTab === 'google' ? 'active' : ''}`}
            onClick={() => setActiveTab('google')}
          >
            Google 계정 로그인
          </button>
          <button 
            type="button" 
            className={`auth-tab-btn ${activeTab === 'email_login' ? 'active' : ''}`}
            onClick={() => setActiveTab('email_login')}
          >
            일반 이메일 로그인
          </button>
          <button 
            type="button" 
            className={`auth-tab-btn ${activeTab === 'email_signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('email_signup')}
          >
            회원가입
          </button>
        </div>

        {/* 탭 1: Google 계정 공식 OAuth 로그인 */}
        {activeTab === 'google' && (
          <div className="oauth-container">
            <button 
              type="button" 
              className="google-primary-account-btn" 
              onClick={handleGoogleOAuthLogin}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  <span>Google 인증 페이지로 연결 중...</span>
                </>
              ) : (
                <>
                  <div className="google-btn-left">
                    <GoogleIcon />
                    <div className="google-account-text">
                      <span className="google-account-title">Google 계정으로 로그인</span>
                      <span className="google-account-email">실제 보유하신 구글 계정으로 안전하게 로그인</span>
                    </div>
                  </div>
                  <UserCheck size={18} className="google-btn-check-icon" />
                </>
              )}
            </button>
            <p style={{ fontSize: '12px', color: 'var(--text-placeholder)', textAlign: 'center', marginTop: '12px', lineHeight: '1.4' }}>
              공식 Google 로그인 창을 통해 실제 존재하는 계정으로 안전하게 인증됩니다.
            </p>
          </div>
        )}

        {/* 탭 2: 일반 이메일 로그인 */}
        {activeTab === 'email_login' && (
          <LoginForm 
            onLogin={onLogin} 
            onSuccess={handleSuccess} 
            onSwitchToSignup={() => setActiveTab('email_signup')} 
          />
        )}

        {/* 탭 3: 이메일 회원가입 */}
        {activeTab === 'email_signup' && (
          <SignupForm 
            onSignup={onSignup} 
            onSuccess={handleSuccess} 
            onSwitchToLogin={() => setActiveTab('email_login')} 
          />
        )}
      </div>
    </Modal>
  );
};
