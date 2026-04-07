import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  conversationId: Joi.string().trim().required(),
  message: Joi.string().trim().min(1).max(2000).required(),
});

export const createConversationSchema = Joi.object({
  // No body required — conversation is created for the authenticated user
});
