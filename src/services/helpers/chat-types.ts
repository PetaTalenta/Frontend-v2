export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  resultId: string;
}

export interface ChatConversation {
  id: string;
  resultId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  assessmentContext?: any;
}

