import appointmentService from '../../services/appointmentService';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '../../middleware/errorHandler';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockCreate = jest.fn();
const mockFindById = jest.fn();
const mockFindByBuyer = jest.fn();
const mockFindBySeller = jest.fn();
const mockUpdate = jest.fn();
const mockCheckDuplicate = jest.fn();

jest.mock('../../repositories/appointmentRepository', () => ({
  __esModule: true,
  default: {
    create: (...a: any[]) => mockCreate(...a),
    findById: (...a: any[]) => mockFindById(...a),
    findByBuyer: (...a: any[]) => mockFindByBuyer(...a),
    findBySeller: (...a: any[]) => mockFindBySeller(...a),
    update: (...a: any[]) => mockUpdate(...a),
    checkDuplicate: (...a: any[]) => mockCheckDuplicate(...a),
  },
}));

// Mock Firestore for seller contact fetching
const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({ get: mockGet }));
const mockCollection = jest.fn(() => ({ doc: mockDoc }));

jest.mock('../../config/firebase', () => ({
  getFirebaseFirestore: jest.fn(() => ({
    collection: mockCollection,
  })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const pastDate = new Date(Date.now() - 1000);

function makeAppointmentData() {
  return {
    listingId: 'listing-1',
    sellerId: 'seller-1',
    requestedDateTime: futureDate,
    reason_to_buy: 'Investment' as const,
    is_property_dealer: false,
    buyer_name: 'John Doe',
    buyer_phone: '+1234567890',
    purchase_timeline: '3 months' as const,
    home_loan_interest: true,
    site_visit_interest: true,
    terms_accepted: true,
    privacy_policy_accepted: true,
  };
}

function makeAppointment(overrides = {}) {
  return {
    id: 'appt-1',
    listingId: 'listing-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    requestedDateTime: futureDate,
    status: 'pending',
    reason_to_buy: 'Investment',
    is_property_dealer: false,
    buyer_name: 'John Doe',
    buyer_phone: '+1234567890',
    terms_accepted: true,
    privacy_policy_accepted: true,
    contact_revealed: true,
    contact_revealed_at: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AppointmentService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── createAppointment ────────────────────────────────────────────────────────

  describe('createAppointment', () => {
    beforeEach(() => {
      // Mock seller contact fetch
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          fullName: 'Jane Seller',
          email: 'seller@example.com',
          buyer_phone: '+0987654321',
        }),
      });
    });

    it('creates appointment successfully and returns seller contact', async () => {
      mockCheckDuplicate.mockResolvedValue(false);
      mockCreate.mockResolvedValue(makeAppointment());

      const result = await appointmentService.createAppointment(
        makeAppointmentData(),
        'buyer-1'
      );

      expect(result.appointment.id).toBe('appt-1');
      expect(result.sellerContact).toEqual({
        name: 'Jane Seller',
        email: 'seller@example.com',
        phone: '+0987654321',
      });
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ 
          buyerId: 'buyer-1', 
          listingId: 'listing-1',
          reason_to_buy: 'Investment',
          is_property_dealer: false,
          buyer_name: 'John Doe',
          buyer_phone: '+1234567890',
          terms_accepted: true,
          privacy_policy_accepted: true,
        })
      );
    });

    it('throws ValidationError for past date', async () => {
      await expect(
        appointmentService.createAppointment(
          { ...makeAppointmentData(), requestedDateTime: pastDate },
          'buyer-1'
        )
      ).rejects.toThrow(ValidationError);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('throws ValidationError when terms not accepted', async () => {
      await expect(
        appointmentService.createAppointment(
          { ...makeAppointmentData(), terms_accepted: false },
          'buyer-1'
        )
      ).rejects.toThrow(ValidationError);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('throws ValidationError when privacy policy not accepted', async () => {
      await expect(
        appointmentService.createAppointment(
          { ...makeAppointmentData(), privacy_policy_accepted: false },
          'buyer-1'
        )
      ).rejects.toThrow(ValidationError);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('throws ConflictError for duplicate appointment', async () => {
      mockCheckDuplicate.mockResolvedValue(true);

      await expect(
        appointmentService.createAppointment(
          makeAppointmentData(),
          'buyer-1'
        )
      ).rejects.toThrow(ConflictError);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  // ── updateAppointmentStatus ──────────────────────────────────────────────────

  describe('updateAppointmentStatus', () => {
    it('seller can confirm a pending appointment', async () => {
      mockFindById.mockResolvedValue(makeAppointment({ status: 'pending' }));
      mockUpdate.mockResolvedValue(makeAppointment({ status: 'confirmed' }));

      const result = await appointmentService.updateAppointmentStatus(
        'appt-1', 'confirmed', 'seller-1', 'seller'
      );

      expect(result.status).toBe('confirmed');
    });

    it('seller can decline a pending appointment', async () => {
      mockFindById.mockResolvedValue(makeAppointment({ status: 'pending' }));
      mockUpdate.mockResolvedValue(makeAppointment({ status: 'declined' }));

      const result = await appointmentService.updateAppointmentStatus(
        'appt-1', 'declined', 'seller-1', 'seller'
      );

      expect(result.status).toBe('declined');
    });

    it('buyer can cancel a pending appointment', async () => {
      mockFindById.mockResolvedValue(makeAppointment({ status: 'pending' }));
      mockUpdate.mockResolvedValue(makeAppointment({ status: 'cancelled' }));

      const result = await appointmentService.updateAppointmentStatus(
        'appt-1', 'cancelled', 'buyer-1', 'buyer'
      );

      expect(result.status).toBe('cancelled');
    });

    it('buyer can cancel a confirmed appointment', async () => {
      mockFindById.mockResolvedValue(makeAppointment({ status: 'confirmed' }));
      mockUpdate.mockResolvedValue(makeAppointment({ status: 'cancelled' }));

      const result = await appointmentService.updateAppointmentStatus(
        'appt-1', 'cancelled', 'buyer-1', 'buyer'
      );

      expect(result.status).toBe('cancelled');
    });

    it('throws ValidationError for invalid seller transition', async () => {
      mockFindById.mockResolvedValue(makeAppointment({ status: 'pending' }));

      await expect(
        appointmentService.updateAppointmentStatus('appt-1', 'cancelled', 'seller-1', 'seller')
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid buyer transition', async () => {
      mockFindById.mockResolvedValue(makeAppointment({ status: 'declined' }));

      await expect(
        appointmentService.updateAppointmentStatus('appt-1', 'cancelled', 'buyer-1', 'buyer')
      ).rejects.toThrow(ValidationError);
    });

    it('throws AuthorizationError when seller does not own appointment', async () => {
      mockFindById.mockResolvedValue(makeAppointment({ sellerId: 'other-seller' }));

      await expect(
        appointmentService.updateAppointmentStatus('appt-1', 'confirmed', 'seller-1', 'seller')
      ).rejects.toThrow(AuthorizationError);
    });

    it('throws AuthorizationError when buyer does not own appointment', async () => {
      mockFindById.mockResolvedValue(makeAppointment({ buyerId: 'other-buyer' }));

      await expect(
        appointmentService.updateAppointmentStatus('appt-1', 'cancelled', 'buyer-1', 'buyer')
      ).rejects.toThrow(AuthorizationError);
    });

    it('throws NotFoundError when appointment does not exist', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(
        appointmentService.updateAppointmentStatus('appt-1', 'confirmed', 'seller-1', 'seller')
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ── getAppointmentsByBuyer / Seller ──────────────────────────────────────────

  describe('getAppointmentsByBuyer', () => {
    it('returns paginated buyer appointments', async () => {
      const paged = { data: [makeAppointment()], pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false } };
      mockFindByBuyer.mockResolvedValue(paged);

      const result = await appointmentService.getAppointmentsByBuyer('buyer-1');

      expect(result.data).toHaveLength(1);
      expect(mockFindByBuyer).toHaveBeenCalledWith('buyer-1', 1, 10);
    });
  });

  describe('getAppointmentsBySeller', () => {
    it('returns paginated seller appointments', async () => {
      const paged = { data: [makeAppointment()], pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false } };
      mockFindBySeller.mockResolvedValue(paged);

      const result = await appointmentService.getAppointmentsBySeller('seller-1');

      expect(result.data).toHaveLength(1);
      expect(mockFindBySeller).toHaveBeenCalledWith('seller-1', 1, 10);
    });
  });
});
