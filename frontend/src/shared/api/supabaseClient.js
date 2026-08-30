import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xuuqejnjtklxkvqfqrxr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1dXFlam5qdGtseGt2cWZxcnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2Mjg2NzYsImV4cCI6MjEwMTIwNDY3Nn0.NdhDA6V2qnNYsk27RtwJByMCk82iT-gw9dhXl9uhRBA';

/**
 * 프론트엔드 Supabase 클라이언트 인스턴스
 * 사용자 인증(Supabase Auth) 및 세션 관리를 담당합니다.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
