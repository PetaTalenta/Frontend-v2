import { startChatConversation, sendChatMessage, getChatConversation } from '../services/chat-api';
import { AssessmentResult } from '../types/assessment-results';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock assessment result data
const mockAssessmentResult: AssessmentResult = {
  id: 'test-result-001',
  status: 'completed',
  createdAt: '2024-01-01T00:00:00Z',
  assessment_data: {
    riasec: { realistic: 80, investigative: 85, artistic: 90, social: 70, enterprising: 75, conventional: 65 },
    ocean: { openness: 88, conscientiousness: 82, extraversion: 75, agreeableness: 80, neuroticism: 45 },
    via_is: { creativity: 92, curiosity: 88, judgment: 85, love_of_learning: 90, perspective: 82 }
  },
  persona_profile: {
    title: 'The Creative Investigator',
    description: 'A highly creative individual with strong analytical capabilities',
    strengths: ['Creative thinking', 'Problem solving', 'Analytical skills', 'Innovation'],
    career_recommendations: [
      { title: 'Data Scientist', match_percentage: 92 },
      { title: 'UX/UI Designer', match_percentage: 88 },
      { title: 'Product Manager', match_percentage: 85 }
    ],
    recommendations: [
      'Develop technical skills in data analysis',
      'Build a portfolio of creative projects',
      'Network with professionals in tech industry',
      'Consider advanced education in relevant fields'
    ]
  }
};

describe('Chat API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('startChatConversation', () => {
    it('should create a new conversation with welcome message', async () => {
      const conversation = await startChatConversation('test-result-001', mockAssessmentResult);

      expect(conversation).toBeDefined();
      expect(conversation.id).toBe('chat-test-result-001');
      expect(conversation.resultId).toBe('test-result-001');
      expect(conversation.messages).toHaveLength(1);
      expect(conversation.messages[0].role).toBe('assistant');
      expect(conversation.messages[0].content).toContain('The Creative Investigator');
    });

    it('should store conversation in localStorage', async () => {
      await startChatConversation('test-result-001', mockAssessmentResult);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chat-conversation-test-result-001',
        expect.any(String)
      );
    });
  });

  describe('sendChatMessage', () => {
    it('should send message and get AI response for career questions', async () => {
      const message = 'Apa saja karir yang cocok untuk saya?';
      const response = await sendChatMessage('chat-test-result-001', 'test-result-001', message);

      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toContain('Data Scientist');
      expect(response.content).toContain('UX/UI Designer');
      expect(response.content).toContain('Product Manager');
    });

    it('should handle strengths-related questions', async () => {
      const message = 'Apa kekuatan saya?';
      const response = await sendChatMessage('chat-test-result-001', 'test-result-001', message);

      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toContain('Creative thinking');
      expect(response.content).toContain('Problem solving');
    });

    it('should handle development-related questions', async () => {
      const message = 'Bagaimana cara pengembangan diri saya?';
      const response = await sendChatMessage('chat-test-result-001', 'test-result-001', message);

      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toContain('Develop technical skills');
      expect(response.content).toContain('Build a portfolio');
    });

    it('should provide default response for general questions', async () => {
      const message = 'Bagaimana cuaca hari ini?';
      const response = await sendChatMessage('chat-test-result-001', 'test-result-001', message);

      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toContain('The Creative Investigator');
      expect(response.content).toContain('Saya bisa membantu Anda dengan');
    });

    it('should update conversation in localStorage', async () => {
      // Mock existing conversation
      const existingConversation = {
        id: 'chat-test-result-001',
        resultId: 'test-result-001',
        messages: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        assessmentContext: mockAssessmentResult
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingConversation));

      await sendChatMessage('chat-test-result-001', 'test-result-001', 'Test message');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chat-conversation-test-result-001',
        expect.any(String)
      );
    });
  });

  describe('getChatConversation', () => {
    it('should retrieve existing conversation from localStorage', async () => {
      const existingConversation = {
        id: 'chat-test-result-001',
        resultId: 'test-result-001',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'Welcome message',
            timestamp: '2024-01-01T00:00:00Z',
            resultId: 'test-result-001'
          }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingConversation));

      const conversation = await getChatConversation('test-result-001');

      expect(conversation).toEqual(existingConversation);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('chat-conversation-test-result-001');
    });

    it('should return null if no conversation exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const conversation = await getChatConversation('test-result-001');

      expect(conversation).toBeNull();
    });

    it('should handle corrupted localStorage data', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const conversation = await getChatConversation('test-result-001');

      expect(conversation).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing assessment context gracefully', async () => {
      const response = await sendChatMessage('chat-test-result-001', 'test-result-001', 'Test message');

      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toContain('konteks hasil assessment');
    });

    it('should handle missing persona profile gracefully', async () => {
      const incompleteResult = {
        ...mockAssessmentResult,
        persona_profile: null
      };

      // Mock conversation with incomplete data
      const conversation = {
        id: 'chat-test-result-001',
        resultId: 'test-result-001',
        messages: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        assessmentContext: incompleteResult
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(conversation));

      const response = await sendChatMessage('chat-test-result-001', 'test-result-001', 'Test message');

      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toContain('data profil kepribadian');
    });
  });
});
