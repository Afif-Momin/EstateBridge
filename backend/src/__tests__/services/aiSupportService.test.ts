import { aiSupportService } from '../../services/aiSupportService';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  getFirebaseFirestore: jest.fn(),
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    ai: { apiKey: 'test-key', apiUrl: 'https://api.openai.com/v1' },
  },
}));

import { getFirebaseFirestore } from '../../config/firebase';

const mockSet = jest.fn().mockResolvedValue(undefined);
const mockAdd = jest.fn().mockResolvedValue({ id: 'conv-123' });
const mockGet = jest.fn();
const mockDoc = jest.fn().mockReturnValue({ get: mockGet, set: mockSet });
const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc, add: mockAdd });

(getFirebaseFirestore as jest.Mock).mockReturnValue({ collection: mockCollection });

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('aiSupportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    aiSupportService._resetCircuitBreaker();
    (getFirebaseFirestore as jest.Mock).mockReturnValue({ collection: mockCollection });
    mockDoc.mockReturnValue({ get: mockGet, set: mockSet });
    mockCollection.mockReturnValue({ doc: mockDoc, add: mockAdd });
  });

  describe('createConversation', () => {
    it('creates a new conversation and returns its ID', async () => {
      const id = await aiSupportService.createConversation('user-1');
      expect(id).toBe('conv-123');
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', messages: [] })
      );
    });
  });

  describe('getConversation', () => {
    it('returns empty array when conversation does not exist', async () => {
      mockGet.mockResolvedValueOnce({ exists: false });
      const msgs = await aiSupportService.getConversation('conv-1', 'user-1');
      expect(msgs).toEqual([]);
    });

    it('returns empty array when conversation belongs to different user', async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ userId: 'other-user', messages: [] }),
      });
      const msgs = await aiSupportService.getConversation('conv-1', 'user-1');
      expect(msgs).toEqual([]);
    });

    it('returns messages for the correct user', async () => {
      const now = new Date().toISOString();
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          userId: 'user-1',
          messages: [{ id: 'm1', role: 'user', content: 'Hello', timestamp: now }],
        }),
      });
      const msgs = await aiSupportService.getConversation('conv-1', 'user-1');
      expect(msgs).toHaveLength(1);
      expect(msgs[0].content).toBe('Hello');
      expect(msgs[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('sendMessage', () => {
    it('calls AI API and stores messages when circuit is closed', async () => {
      mockGet.mockResolvedValueOnce({ exists: false });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'AI response here' } }],
        }),
      });

      const result = await aiSupportService.sendMessage('conv-1', 'user-1', 'Hello AI');

      expect(result.message).toBe('AI response here');
      expect(result.conversationId).toBe('conv-1');
      expect(mockSet).toHaveBeenCalled();
    });

    it('returns fallback message when AI API fails', async () => {
      mockGet.mockResolvedValueOnce({ exists: false });
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await aiSupportService.sendMessage('conv-1', 'user-1', 'Hello');

      expect(result.message).toContain("I'm sorry");
      expect(mockSet).toHaveBeenCalled();
    });

    it('returns fallback message when AI API returns non-ok status', async () => {
      mockGet.mockResolvedValueOnce({ exists: false });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await aiSupportService.sendMessage('conv-1', 'user-1', 'Hello');

      expect(result.message).toContain("I'm sorry");
    });

    it('returns fallback when circuit breaker is OPEN', async () => {
      // Simulate 5 failures to open circuit
      for (let i = 0; i < 5; i++) {
        mockGet.mockResolvedValueOnce({ exists: false });
        mockFetch.mockRejectedValueOnce(new Error('fail'));
        await aiSupportService.sendMessage('conv-x', 'user-1', 'test');
      }

      // Now circuit should be OPEN
      mockGet.mockResolvedValueOnce({ exists: false });
      const result = await aiSupportService.sendMessage('conv-x', 'user-1', 'test after open');
      expect(result.message).toContain("I'm sorry");
    });

    it('includes existing conversation history in API call', async () => {
      const existingMsg = {
        id: 'm1',
        role: 'user',
        content: 'Previous message',
        timestamp: new Date().toISOString(),
      };
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ userId: 'user-1', messages: [existingMsg] }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Follow-up response' } }] }),
      });

      await aiSupportService.sendMessage('conv-1', 'user-1', 'Follow-up');

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      // Should include system + previous + new user message
      expect(body.messages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('circuit breaker', () => {
    it('starts in CLOSED state', () => {
      const cb = aiSupportService._getCircuitBreaker();
      expect(cb.state).toBe('CLOSED');
    });

    it('opens after threshold failures', async () => {
      for (let i = 0; i < 5; i++) {
        mockGet.mockResolvedValueOnce({ exists: false });
        mockFetch.mockRejectedValueOnce(new Error('fail'));
        await aiSupportService.sendMessage('conv-x', 'user-1', 'test');
      }
      const cb = aiSupportService._getCircuitBreaker();
      expect(cb.state).toBe('OPEN');
    });

    it('resets to CLOSED state via _resetCircuitBreaker', () => {
      aiSupportService._resetCircuitBreaker();
      const cb = aiSupportService._getCircuitBreaker();
      expect(cb.state).toBe('CLOSED');
      expect(cb.failureCount).toBe(0);
    });
  });
});
