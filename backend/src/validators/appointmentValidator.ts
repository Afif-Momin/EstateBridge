import Joi from 'joi';
import { APPOINTMENT_STATUS } from '../constants';

/**
 * Schema for creating an appointment
 */
export const createAppointmentSchema = Joi.object({
  listingId: Joi.string().required().messages({
    'any.required': 'listingId is required',
  }),

  sellerId: Joi.string().required().messages({
    'any.required': 'sellerId is required',
  }),

  requestedDateTime: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Requested date/time must be in the future',
    'any.required': 'requestedDateTime is required',
  }),

  // Qualification fields (Requirements 9.1, 9.2, 9.3)
  reason_to_buy: Joi.string().valid('Investment', 'Self Use').required().messages({
    'any.only': 'reason_to_buy must be either "Investment" or "Self Use"',
    'any.required': 'reason_to_buy is required',
  }),

  is_property_dealer: Joi.boolean().required().messages({
    'any.required': 'is_property_dealer is required',
  }),

  buyer_name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'buyer_name must be at least 2 characters',
    'string.max': 'buyer_name must not exceed 100 characters',
    'any.required': 'buyer_name is required',
  }),

  buyer_phone: Joi.string().min(10).max(15).required().messages({
    'string.min': 'buyer_phone must be at least 10 characters',
    'string.max': 'buyer_phone must not exceed 15 characters',
    'any.required': 'buyer_phone is required',
  }),

  // Optional qualification fields
  purchase_timeline: Joi.string().valid('3 months', '6 months', 'More than 6 months').optional().messages({
    'any.only': 'purchase_timeline must be one of: "3 months", "6 months", "More than 6 months"',
  }),

  home_loan_interest: Joi.boolean().optional(),

  site_visit_interest: Joi.boolean().optional(),

  // Terms acceptance
  terms_accepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the terms and conditions',
    'any.required': 'terms_accepted is required',
  }),

  privacy_policy_accepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the privacy policy',
    'any.required': 'privacy_policy_accepted is required',
  }),
});

/**
 * Schema for updating appointment status
 */
export const updateAppointmentStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      APPOINTMENT_STATUS.CONFIRMED,
      APPOINTMENT_STATUS.DECLINED,
      APPOINTMENT_STATUS.CANCELLED
    )
    .required()
    .messages({
      'any.only': 'Status must be one of: confirmed, declined, cancelled',
      'any.required': 'status is required',
    }),
});

/**
 * Validation middleware factory
 */
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
