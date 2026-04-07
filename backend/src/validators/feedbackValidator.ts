import Joi from 'joi';
import { VALIDATION } from '../constants';

export const submitFeedbackSchema = Joi.object({
  listingId: Joi.string().required().messages({
    'any.required': 'listingId is required',
  }),

  rating: Joi.number()
    .integer()
    .min(VALIDATION.RATING_MIN)
    .max(VALIDATION.RATING_MAX)
    .required()
    .messages({
      'number.integer': 'Rating must be an integer',
      'number.min': `Rating must be at least ${VALIDATION.RATING_MIN}`,
      'number.max': `Rating must not exceed ${VALIDATION.RATING_MAX}`,
      'any.required': 'rating is required',
    }),

  comment: Joi.string()
    .min(VALIDATION.FEEDBACK_COMMENT_MIN_LENGTH)
    .max(VALIDATION.FEEDBACK_COMMENT_MAX_LENGTH)
    .required()
    .messages({
      'string.min': `Comment must be at least ${VALIDATION.FEEDBACK_COMMENT_MIN_LENGTH} characters`,
      'string.max': `Comment must not exceed ${VALIDATION.FEEDBACK_COMMENT_MAX_LENGTH} characters`,
      'any.required': 'comment is required',
    }),
});

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const fields: { [key: string]: string[] } = {};
      error.details.forEach((detail) => {
        const field = detail.path[0] as string;
        if (!fields[field]) fields[field] = [];
        fields[field].push(detail.message);
      });

      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields },
        timestamp: new Date().toISOString(),
      });
    }

    req.body = value;
    next();
  };
};
