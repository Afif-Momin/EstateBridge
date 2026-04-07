import request from 'supertest';
import app from '../../server';

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'user-123';
    req.userRole = 'buyer';
    next();
  },
  optionalAuth: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../services/aiSupportService', () => ({
  aiSupportService: {
    createConversation: jest.fn(),
    sendMessage: jest.fn(),
    getConversation: jest.fn(),
  },
}));

import { aiSupportService } from '../../services/aiSupportService';

const mockService = aiSupportService as jest.Mocked<typeof aiSupportService>;

describe('AI Support Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/v1/ai-support/conversation', () => {
    it('creates a conversation and returns 201', async () => {
      (mockService.createConversation as jest.Mock).mockResolvedValue('conv-abc');

      const res = await request(app).post('/api/v1/ai-support/conversation').send();

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversationId).toBe('conv-abc');
    });

    it('returns 500 on service error', async () => {
      (mockService.createConversation as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/api/v1/ai-support/conversation').send();

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/v1/ai-support/message', () => {
    it('sends a message and returns AI response', async () => {
      (mockService.sendMessage as jest.Mock).mockResolvedValue({
        message: 'Hello from AI',
        conversationId: 'conv-abc',
        timestamp: new Date(),
      });

      const res = await request(app).post('/api/v1/ai-support/message').send({
        conversationId: 'conv-abc',
        message: 'What properties are available?',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Hello from AI');
    });

    it('returns 400 when message is missing', async () => {
      const res = await request(app).post('/api/v1/ai-support/message').send({
        conversationId: 'conv-abc',
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when conversationId is missing', async () => {
      const res = await request(app).post('/api/v1/ai-support/message').send({
        message: 'Hello',
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when message is empty string', async () => {
      const res = await request(app).post('/api/v1/ai-support/message').send({
        conversationId: 'conv-abc',
        message: '',
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when message exceeds 2000 chars', async () => {
      const res = await request(app).post('/api/v1/ai-support/message').send({
        conversationId: 'conv-abc',
        message: 'a'.repeat(2001),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/ai-support/conversation/:id', () => {
    it('returns conversation history', async () => {
      const messages = [
        { id: 'm1', role: 'user', content: 'Hello', timestamp: new Date() },
        { id: 'm2', role: 'assistant', content: 'Hi there!', timestamp: new Date() },
      ];
      (mockService.getConversation as jest.Mock).mockResolvedValue(messages);

      const res = await request(app).get('/api/v1/ai-support/conversation/conv-abc');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversationId).toBe('conv-abc');
      expect(res.body.data.messages).toHaveLength(2);
    });

    it('returns empty messages array when conversation not found', async () => {
      (mockService.getConversation as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/api/v1/ai-support/conversation/nonexistent');

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toEqual([]);
    });
  });
});
