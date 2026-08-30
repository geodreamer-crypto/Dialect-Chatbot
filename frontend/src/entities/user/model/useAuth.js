import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/api/supabaseClient';

const GUEST_COUNT_STORAGE_KEY = 'jemini_guest_question_count';
const PENDING_MESSAGE_STORAGE_KEY = 'jemini_pending_message';
const LOCAL_USER_STORAGE_KEY = 'jemini_authenticated_user';
const MAX_FREE_GUEST_QUESTIONS = 2;

/**
 * 사용자 인증 및 게스트 세션 질문 카운트를 관리하는 커스텀 훅
 * - Supabase Auth (Google OAuth & 이메일/간편 연동) 상태 실시간 감지
 * - Google Cloud Console 설정 불일치 시에도 안정적인 원클릭 Google 계정 로그인 지원
 * - 비로그인 시 sessionStorage를 통해 2회 무료 체험 질문 카운트 관리
 */
export const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [guestCount, setGuestCount] = useState(() => {
    try {
      const saved = sessionStorage.getItem(GUEST_COUNT_STORAGE_KEY);
      return saved !== null ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Supabase 세션 초기화 및 상태 변경 구독
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            try {
              localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(initialSession.user));
            } catch (e) {
              console.warn(e);
            }
          }
          setIsLoadingAuth(false);
        }
      } catch (err) {
        console.error('Error fetching auth session:', err);
        if (mounted) setIsLoadingAuth(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          try {
            localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(currentSession.user));
          } catch (e) {
            console.warn(e);
          }
        }
        setIsLoadingAuth(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // 게스트 질문 카운트 증가
  const incrementGuestCount = useCallback(() => {
    setGuestCount(prev => {
      const newCount = prev + 1;
      try {
        sessionStorage.setItem(GUEST_COUNT_STORAGE_KEY, newCount.toString());
      } catch (e) {
        console.warn('Failed to save guest count in sessionStorage', e);
      }
      return newCount;
    });
  }, []);

  // 게스트 질문 카운트 초기화
  const resetGuestCount = useCallback(() => {
    setGuestCount(0);
    try {
      sessionStorage.removeItem(GUEST_COUNT_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear guest count', e);
    }
  }, []);

  // 질문 전송 가능 여부 (로그인 상태이거나 게스트 카운트가 2 미만인 경우)
  const canSendQuestion = useCallback(() => {
    if (user) return true;
    return guestCount < MAX_FREE_GUEST_QUESTIONS;
  }, [user, guestCount]);

  // 남은 무료 질문 횟수
  const remainingFreeQuestions = Math.max(0, MAX_FREE_GUEST_QUESTIONS - guestCount);

  // Google 공식 OAuth 리디렉션 로그인 함수 (항상 원하는 Google 계정을 직접 선택 가능)
  const loginWithGoogle = async (pendingMsg = null) => {
    if (pendingMsg) {
      try {
        sessionStorage.setItem(PENDING_MESSAGE_STORAGE_KEY, JSON.stringify(pendingMsg));
      } catch (e) {
        console.warn('Failed to save pending message for OAuth redirect', e);
      }
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account', // 기존 계정으로 자동 로그인되지 않고 항상 Google 계정 선택 화면 표시
        },
      },
    });
    if (error) throw error;
    return data;
  };

  // OAuth 리다이렉트 후 저장되어 있던 보류 메시지 가져오기 및 삭제
  const popPendingMessage = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(PENDING_MESSAGE_STORAGE_KEY);
      if (saved) {
        sessionStorage.removeItem(PENDING_MESSAGE_STORAGE_KEY);
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse pending message', e);
    }
    return null;
  }, []);

  // 이메일 로그인 함수
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setUser(data.user);
    setSession(data.session);
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(data.user));
    return data;
  };

  // 이메일 회원가입 함수
  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    if (data?.user && data?.session) {
      setUser(data.user);
      setSession(data.session);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(data.user));
    }
    return data;
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Supabase logout warning:', error);
    }
    setUser(null);
    setSession(null);
    try {
      localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
  };

  return {
    user,
    session,
    isLoggedIn: !!user,
    isLoadingAuth,
    guestCount,
    maxFreeQuestions: MAX_FREE_GUEST_QUESTIONS,
    remainingFreeQuestions,
    canSendQuestion,
    incrementGuestCount,
    resetGuestCount,
    loginWithGoogle,
    popPendingMessage,
    login,
    signup,
    logout,
  };
};
