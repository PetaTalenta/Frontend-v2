// Simple chat types for UI-only functionality
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  resultId?: string;
}

export interface ChatConversation {
  id: string;
  messages: ChatMessage[];
  assessmentContext?: any;
}