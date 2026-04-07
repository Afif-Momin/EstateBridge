import { Response } from 'express';
import { SuccessResponse, PaginatedResponse } from '../types';

/**
 * Send a success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 */
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response => {
  const totalPages = Math.ceil(total / limit);

  const response: SuccessResponse<PaginatedResponse<T>> = {
    success: true,
    data: {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(200).json(response);
};

/**
 * Send a created response
 */
export const sendCreated = <T>(res: Response, data: T, message?: string): Response => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send a no content response
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};
