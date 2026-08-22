import { Sparkles, Zap, Brain, Bot } from 'lucide-react';

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    provider: 'google_genai',
    model: 'gemini-3.6-flash',
    description: '빠른 속도와 뛰어난 사투리 번역 (기본 권장)',
    badge: 'Google',
    icon: Sparkles,
    badgeColor: '#4285f4'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google_genai',
    model: 'gemini-1.5-pro',
    description: '심도 있는 맥락 이해 및 뉘앙스 번역',
    badge: 'Google',
    icon: Sparkles,
    badgeColor: '#4285f4'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    model: 'gpt-4o-mini',
    description: '가성비와 빠른 응답 속도의 경량 모델',
    badge: 'OpenAI',
    icon: Zap,
    badgeColor: '#10a37f'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    model: 'gpt-4o',
    description: '정교한 지시 준수 및 고성능 플래그십 모델',
    badge: 'OpenAI',
    icon: Zap,
    badgeColor: '#10a37f'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    description: '자연스러운 어휘 구사와 높은 문맥 이해도',
    badge: 'Anthropic',
    icon: Brain,
    badgeColor: '#d97706'
  },
  {
    id: 'ollama-llama3',
    name: 'Ollama LLaMA 3.2',
    provider: 'ollama',
    model: 'llama3.2',
    description: '로컬 환경에서 구동되는 프라이빗 LLM',
    badge: 'Local',
    icon: Bot,
    badgeColor: '#8b5cf6'
  }
];
