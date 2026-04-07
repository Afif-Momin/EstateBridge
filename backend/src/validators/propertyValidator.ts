import Joi from 'joi';
import { PROPERTY_TYPES, PROPERTY_STATUS, VALIDATION } from '../constants';

const propertyTypeValues = Object.values(PROPERTY_TYPES);
const propertyStatusValues = Object.values(PROPERTY_STATUS);

/**
 * Schema for creating a property
 */
export const createPropertySchema = Joi.object({
  title: Joi.string()
    .min(VALIDATION.PROPERTY_TITLE_MIN_LENGTH)
    .max(VALIDATION.PROPERTY_TITLE_MAX_LENGTH)
    .required()
    .messages({
      'string.min': `Title must be at least ${VALIDATION.PROPERTY_TITLE_MIN_LENGTH} characters`,
      'string.max': `Title must not exceed ${VALIDATION.PROPERTY_TITLE_MAX_LENGTH} characters`,
      'any.required': 'Title is required',
    }),

  description: Joi.string()
    .min(VALIDATION.PROPERTY_DESCRIPTION_MIN_LENGTH)
    .max(VALIDATION.PROPERTY_DESCRIPTION_MAX_LENGTH)
    .required()
    .messages({
      'string.min': `Description must be at least ${VALIDATION.PROPERTY_DESCRIPTION_MIN_LENGTH} characters`,
      'string.max': `Description must not exceed ${VALIDATION.PROPERTY_DESCRIPTION_MAX_LENGTH} characters`,
      'any.required': 'Description is required',
    }),

  price: Joi.number().positive().required().messages({
    'number.positive': 'Price must be a positive number',
    'any.required': 'Price is required',
  }),

  region: Joi.string().trim().required().messages({
    'any.required': 'Region is required',
  }),

  address: Joi.string()
    .min(VALIDATION.PROPERTY_ADDRESS_MIN_LENGTH)
    .max(VALIDATION.PROPERTY_ADDRESS_MAX_LENGTH)
    .required()
    .messages({
      'string.min': `Address must be at least ${VALIDATION.PROPERTY_ADDRESS_MIN_LENGTH} characters`,
      'string.max': `Address must not exceed ${VALIDATION.PROPERTY_ADDRESS_MAX_LENGTH} characters`,
      'any.required': 'Address is required',
    }),

  propertyType: Joi.string()
    .valid(...propertyTypeValues)
    .required()
    .messages({
      'any.only': `Property type must be one of: ${propertyTypeValues.join(', ')}`,
      'any.required': 'Property type is required',
    }),

  status: Joi.string()
    .valid(...propertyStatusValues)
    .default('available')
    .messages({
      'any.only': `Status must be one of: ${propertyStatusValues.join(', ')}`,
    }),
});

/**
 * Schema for updating a property (all fields optional)
 */
export const updatePropertySchema = Joi.object({
  title: Joi.string()
    .min(VALIDATION.PROPERTY_TITLE_MIN_LENGTH)
    .max(VALIDATION.PROPERTY_TITLE_MAX_LENGTH)
    .messages({
      'string.min': `Title must be at least ${VALIDATION.PROPERTY_TITLE_MIN_LENGTH} characters`,
      'string.max': `Title must not exceed ${VALIDATION.PROPERTY_TITLE_MAX_LENGTH} characters`,
    }),

  description: Joi.string()
    .min(VALIDATION.PROPERTY_DESCRIPTION_MIN_LENGTH)
    .max(VALIDATION.PROPERTY_DESCRIPTION_MAX_LENGTH)
    .messages({
      'string.min': `Description must be at least ${VALIDATION.PROPERTY_DESCRIPTION_MIN_LENGTH} characters`,
      'string.max': `Description must not exceed ${VALIDATION.PROPERTY_DESCRIPTION_MAX_LENGTH} characters`,
    }),

  price: Joi.number().positive().messages({
    'number.positive': 'Price must be a positive number',
  }),

  region: Joi.string().trim(),

  address: Joi.string()
    .min(VALIDATION.PROPERTY_ADDRESS_MIN_LENGTH)
    .max(VALIDATION.PROPERTY_ADDRESS_MAX_LENGTH)
    .messages({
      'string.min': `Address must be at least ${VALIDATION.PROPERTY_ADDRESS_MIN_LENGTH} characters`,
      'string.max': `Address must not exceed ${VALIDATION.PROPERTY_ADDRESS_MAX_LENGTH} characters`,
    }),

  propertyType: Joi.string()
    .valid(...propertyTypeValues)
    .messages({
      'any.only': `Property type must be one of: ${propertyTypeValues.join(', ')}`,
    }),

  status: Joi.string()
    .valid(...propertyStatusValues)
    .messages({
      'any.only': `Status must be one of: ${propertyStatusValues.join(', ')}`,
    }),
}).min(1); // at least one field required

/**
 * Schema for deleting images (array of URLs)
 */
export const deleteImagesSchema = Joi.object({
  imageUrls: Joi.array().items(Joi.string().uri()).min(1).required().messages({
    'array.min': 'At least one image URL is required',
    'any.required': 'imageUrls is required',
  }),
});

/**
 * Validation middleware factory (reusable)
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
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          fields,
        },
        timestamp: new Date().toISOString(),
      });
    }

    req.body = value;
    next();
  };
};
