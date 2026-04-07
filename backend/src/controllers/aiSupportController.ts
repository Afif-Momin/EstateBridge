import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { aiSupportService } from '../services/aiSupportService';
import { sendMessageSchema } from '../validators/aiSupportValidator';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { HTTP_STATUS } from '../constants';
import { ValidationError } from '../middleware/errorHandler';

/**
 * POST /api/v1/ai-support/conversation
 * Create a new conversation for the authenticated user.
 */
export const createConversation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const conversationId = await aiSupportService.createConversation(userId);
  sendSuccess(res, { conversationId }, 'Conversation created', HTTP_STATUS.CREATED);
});

/**
 * POST /api/v1/ai-support/message
 * Send a message within an existing conversation.
 */
export const sendMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { error, value } = sendMessageSchema.validate(req.body, { abortEarly: false });
  if (error) {
    throw new ValidationError(
      error.details.map((d) => d.message).join(', ')
    );
  }

  const userId = req.userId!;
  const { conversationId, message } = value;

  const aiResponse = await aiSupportService.sendMessage(conversationId, userId, message);
  sendSuccess(res, aiResponse, 'Message sent');
});

/**
 * GET /api/v1/ai-support/conversation/:id
 * Retrieve conversation history.
 */
export const getConversation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const messages = await aiSupportService.getConversation(id, userId);
  sendSuccess(res, { conversationId: id, messages });
});
