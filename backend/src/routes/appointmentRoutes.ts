import { Router } from 'express';
import {
  createAppointment,
  getBuyerAppointments,
  getSellerAppointments,
  updateAppointmentStatus,
} from '../controllers/appointmentController';
import { authenticate } from '../middleware/auth';
import { attachUserRole, requireBuyer, requireSeller } from '../middleware/rbac';
import {
  validate,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validators/appointmentValidator';
import { appointmentRequestRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   POST /api/v1/appointments
 * @desc    Create a new appointment
 * @access  Private (buyer only)
 */
router.post(
  '/',
  authenticate,
  attachUserRole,
  requireBuyer,
  appointmentRequestRateLimiter,
  validate(createAppointmentSchema),
  createAppointment
);

/**
 * @route   GET /api/v1/appointments/buyer/me
 * @desc    Get all appointments for the authenticated buyer
 * @access  Private (buyer only)
 */
router.get(
  '/buyer/me',
  authenticate,
  attachUserRole,
  requireBuyer,
  getBuyerAppointments
);

/**
 * @route   GET /api/v1/appointments/seller/me
 * @desc    Get all appointments for the authenticated seller
 * @access  Private (seller only)
 */
router.get(
  '/seller/me',
  authenticate,
  attachUserRole,
  requireSeller,
  getSellerAppointments
);

/**
 * @route   PATCH /api/v1/appointments/:id
 * @desc    Update appointment status (confirm/decline by seller, cancel by buyer)
 * @access  Private (buyer or seller)
 */
router.patch(
  '/:id',
  authenticate,
  attachUserRole,
  validate(updateAppointmentStatusSchema),
  updateAppointmentStatus
);

export default router;
