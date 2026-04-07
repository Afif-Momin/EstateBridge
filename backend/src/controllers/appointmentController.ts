import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import appointmentService from '../services/appointmentService';
import { logger } from '../utils/logger';
import { PAGINATION } from '../constants';

function parsePagination(query: any) {
  const page = Math.max(1, parseInt(query.page as string) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit as string) || PAGINATION.DEFAULT_LIMIT)
  );
  return { page, limit };
}

/**
 * POST /api/v1/appointments
 * Create a new appointment (buyer only)
 * Requirements: 9.1, 9.2, 9.3, 9.5, 10.1
 */
export const createAppointment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const buyerId = req.userId!;
    const {
      listingId,
      sellerId,
      requestedDateTime,
      reason_to_buy,
      is_property_dealer,
      buyer_name,
      buyer_phone,
      purchase_timeline,
      home_loan_interest,
      site_visit_interest,
      terms_accepted,
      privacy_policy_accepted,
    } = req.body;

    const result = await appointmentService.createAppointment(
      {
        listingId,
        sellerId,
        requestedDateTime: new Date(requestedDateTime),
        reason_to_buy,
        is_property_dealer,
        buyer_name,
        buyer_phone,
        purchase_timeline,
        home_loan_interest,
        site_visit_interest,
        terms_accepted,
        privacy_policy_accepted,
      },
      buyerId
    );

    logger.info('Appointment created', { appointmentId: result.appointment.id, buyerId });

    res.status(201).json({
      success: true,
      data: {
        appointment: result.appointment,
        sellerContact: result.sellerContact,
      },
      message: 'Appointment created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/appointments/buyer/me
 * Get all appointments for the authenticated buyer
 */
export const getBuyerAppointments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const buyerId = req.userId!;
    const { page, limit } = parsePagination(req.query);
    const result = await appointmentService.getAppointmentsByBuyer(buyerId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/appointments/seller/me
 * Get all appointments for the authenticated seller
 */
export const getSellerAppointments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sellerId = req.userId!;
    const { page, limit } = parsePagination(req.query);
    const result = await appointmentService.getAppointmentsBySeller(sellerId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/appointments/:id
 * Update appointment status (buyer or seller, with authorization check)
 */
export const updateAppointmentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.userRole!;
    const { status } = req.body;

    const appointment = await appointmentService.updateAppointmentStatus(
      id,
      status,
      userId,
      userRole
    );

    logger.info('Appointment status updated', { appointmentId: id, userId, status });

    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment status updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
