import Joi from 'joi';
import { USER_ROLES, VALIDATION } from '../constants';

/**
 * Registration validation schema
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH)
    .max(VALIDATION.PASSWORD_MAX_LENGTH)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long`,
      'string.max': `Password must not exceed ${VALIDATION.PASSWORD_MAX_LENGTH} characters`,
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),
  
  fullName: Joi.string()
    .min(VALIDATION.FULL_NAME_MIN_LENGTH)
    .max(VALIDATION.FULL_NAME_MAX_LENGTH)
    .pattern(/^[a-zA-Z\s-]+$/)
    .required()
    .messages({
      'string.min': `Full name must be at least ${VALIDATION.FULL_NAME_MIN_LENGTH} characters long`,
      'string.max': `Full name must not exceed ${VALIDATION.FULL_NAME_MAX_LENGTH} characters`,
      'string.pattern.base': 'Full name must contain only letters, spaces, and hyphens',
      'any.required': 'Full name is required',
    }),
  
  role: Joi.string()
    .valid(USER_ROLES.BUYER, USER_ROLES.SELLER)
    .required()
    .messages({
      'any.only': 'Role must be either "buyer" or "seller"',
      'any.required': 'Role is required',
    }),
  
  // Location fields (Requirements 1.1, 1.2)
  buy_country: Joi.string()
    .length(2)
    .uppercase()
    .required()
    .messages({
      'string.length': 'Country code must be a 2-letter ISO code',
      'any.required': 'Country is required',
    }),
  
  buy_city: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'City is required',
      'string.max': 'City must not exceed 100 characters',
      'any.required': 'City is required',
    }),
  
  buy_state: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'State is required',
      'string.max': 'State must not exceed 100 characters',
      'any.required': 'State is required',
    }),
  
  buy_address: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.min': 'Address is required',
      'string.max': 'Address must not exceed 500 characters',
      'any.required': 'Address is required',
    }),
  
  buy_pincode: Joi.string()
    .min(1)
    .max(20)
    .required()
    .messages({
      'string.min': 'Pincode is required',
      'string.max': 'Pincode must not exceed 20 characters',
      'any.required': 'Pincode is required',
    }),
  
  // Optional fields
  idToken: Joi.string().optional(),
  captchaToken: Joi.string().optional(),
});

/**
 * Login validation schema
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
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
        if (!fields[field]) {
          fields[field] = [];
        }
        fields[field].push(detail.message);
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          fields,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};
