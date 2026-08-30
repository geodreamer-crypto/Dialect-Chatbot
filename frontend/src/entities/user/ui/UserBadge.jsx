import { User, LogOut, LogIn, Sparkles } from 'lucide-react';
import './UserBadge.css';

/**
 * 상단 헤더에 배치되는 사용자 프로필 및 로그인 상태 뱃지 컴포넌트
 * Google OAuth 로그인 시 프로필 사진과 사용자 이름을 자동으로 표시합니다.
 */
export const UserBadge = ({ 
  isLoggedIn, 
  user, 
  remainingFreeQuestions, 
  maxFreeQuestions, 
  onOpenLogin, 
  onLogout 
}) => {
  if (isLoggedIn && user) {
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    const userDisplayName = user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : '사용자');

    return (
      <div className="user-badge-container">
        <div className="user-info-pill" title={user.email || userDisplayName}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={userDisplayName} className="user-avatar-img" />
          ) : (
            <div className="user-avatar">
              <User size={14} />
            </div>
          )}
          <span className="user-name">{userDisplayName}</span>
          <span className="user-status-unlimited">무제한</span>
        </div>
        <button 
          className="auth-action-btn logout" 
          onClick={onLogout} 
          title="로그아웃"
        >
          <LogOut size={16} />
          <span className="btn-text">로그아웃</span>
        </button>
      </div>
    );
  }

  return (
    <div className="user-badge-container">
      <div className={`guest-quota-pill ${remainingFreeQuestions === 0 ? 'exhausted' : ''}`}>
        <Sparkles size={13} className="quota-icon" />
        <span>무료 질문 {remainingFreeQuestions}/{maxFreeQuestions}회</span>
      </div>
      <button 
        className="auth-action-btn login" 
        onClick={onOpenLogin}
      >
        <LogIn size={16} />
        <span className="btn-text">로그인</span>
      </button>
    </div>
  );
};
