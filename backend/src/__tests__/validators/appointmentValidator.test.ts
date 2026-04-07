import { createAppointmentSchema, updateAppointmentStatusSchema } from '../../validators/appointmentValidator';
import { APPOINTMENT_STATUS } from '../../constants';

describe('Appointment Validators', () => {
  describe('createAppointmentSchema', () => {
    const validAppointmentData = {
      listingId: 'listing123',
      sellerId: 'seller123',
      requestedDateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      reason_to_buy: 'Investment',
      is_property_dealer: false,
      buyer_name: 'John Doe',
      buyer_phone: '1234567890',
      terms_accepted: true,
      privacy_policy_accepted: true,
    };

    describe('Required Fields Validation', () => {
      it('should validate a complete appointment request', () => {
        const { error, value } = createAppointmentSchema.validate(validAppointmentData);
        expect(error).toBeUndefined();
        expect(value.listingId).toBe(validAppointmentData.listingId);
        expect(value.sellerId).toBe(validAppointmentData.sellerId);
        expect(value.reason_to_buy).toBe(validAppointmentData.reason_to_buy);
        expect(value.buyer_name).toBe(validAppointmentData.buyer_name);
        expect(value.buyer_phone).toBe(validAppointmentData.buyer_phone);
        expect(value.terms_accepted).toBe(true);
        expect(value.privacy_policy_accepted).toBe(true);
      });

      it('should reject when listingId is missing', () => {
        const { listingId, ...data } = validAppointmentData;
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('listingId is required');
      });

      it('should reject when sellerId is missing', () => {
        const { sellerId, ...data } = validAppointmentData;
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('sellerId is required');
      });

      it('should reject when requestedDateTime is missing', () => {
        const { requestedDateTime, ...data } = validAppointmentData;
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('requestedDateTime is required');
      });

      it('should reject when requestedDateTime is in the past', () => {
        const data = {
          ...validAppointmentData,
          requestedDateTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('must be in the future');
      });
    });

    describe('Qualification Fields Validation (Requirements 9.1, 9.2, 9.3)', () => {
      it('should reject when reason_to_buy is missing', () => {
        const { reason_to_buy, ...data } = validAppointmentData;
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('reason_to_buy is required');
      });

      it('should accept "Investment" as reason_to_buy', () => {
        const data = { ...validAppointmentData, reason_to_buy: 'Investment' };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should accept "Self Use" as reason_to_buy', () => {
        const data = { ...validAppointmentData, reason_to_buy: 'Self Use' };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should reject invalid reason_to_buy values', () => {
        const data = { ...validAppointmentData, reason_to_buy: 'Other' };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('must be either "Investment" or "Self Use"');
      });

      it('should reject when is_property_dealer is missing', () => {
        const { is_property_dealer, ...data } = validAppointmentData;
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('is_property_dealer is required');
      });

      it('should accept boolean values for is_property_dealer', () => {
        const dataTrue = { ...validAppointmentData, is_property_dealer: true };
        const dataFalse = { ...validAppointmentData, is_property_dealer: false };
        
        expect(createAppointmentSchema.validate(dataTrue).error).toBeUndefined();
        expect(createAppointmentSchema.validate(dataFalse).error).toBeUndefined();
      });

      it('should reject when buyer_name is missing', () => {
        const { buyer_name, ...data } = validAppointmentData;
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('buyer_name is required');
      });

      it('should reject buyer_name shorter than 2 characters', () => {
        const data = { ...validAppointmentData, buyer_name: 'A' };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('must be at least 2 characters');
      });

      it('should reject buyer_name longer than 100 characters', () => {
        const data = { ...validAppointmentData, buyer_name: 'A'.repeat(101) };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('must not exceed 100 characters');
      });

      it('should reject when buyer_phone is missing', () => {
        const { buyer_phone, ...data } = validAppointmentData;
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('buyer_phone is required');
      });

      it('should reject buyer_phone shorter than 10 characters', () => {
        const data = { ...validAppointmentData, buyer_phone: '123456789' };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('must be at least 10 characters');
      });

      it('should reject buyer_phone longer than 15 characters', () => {
        const data = { ...validAppointmentData, buyer_phone: '1234567890123456' };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('must not exceed 15 characters');
      });
    });

    describe('Optional Qualification Fields', () => {
      it('should accept valid purchase_timeline values', () => {
        const timelines = ['3 months', '6 months', 'More than 6 months'];
        
        timelines.forEach(timeline => {
          const data = { ...validAppointmentData, purchase_timeline: timeline };
          const { error } = createAppointmentSchema.validate(data);
          expect(error).toBeUndefined();
        });
      });

      it('should reject invalid purchase_timeline values', () => {
        const data = { ...validAppointmentData, purchase_timeline: '1 year' };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('must be one of');
      });

      it('should accept appointment without purchase_timeline', () => {
        const { error } = createAppointmentSchema.validate(validAppointmentData);
        expect(error).toBeUndefined();
      });

      it('should accept boolean values for home_loan_interest', () => {
        const dataTrue = { ...validAppointmentData, home_loan_interest: true };
        const dataFalse = { ...validAppointmentData, home_loan_interest: false };
        
        expect(createAppointmentSchema.validate(dataTrue).error).toBeUndefined();
        expect(createAppointmentSchema.validate(dataFalse).error).toBeUndefined();
      });

      it('should accept appointment without home_loan_interest', () => {
        const { error } = createAppointmentSchema.validate(validAppointmentData);
        expect(error).toBeUndefined();
      });

      it('should accept boolean values for site_visit_interest', () => {
        const dataTrue = { ...validAppointmentData, site_visit_interest: true };
        const dataFalse = { ...validAppointmentData, site_visit_interest: false };
        
        expect(createAppointmentSchema.validate(dataTrue).error).toBeUndefined();
        expect(createAppointmentSchema.validate(dataFalse).error).toBeUndefined();
      });

      it('should accept appointment without site_visit_interest', () => {
        const { error } = createAppointmentSchema.validate(validAppointmentData);
        expect(error).toBeUndefined();
      });
    });

    describe('Terms Acceptance Validation (Requirement 9.3)', () => {
      it('should reject when terms_accepted is missing', () => {
        const { terms_accepted, ...data } = validAppointmentData;
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('terms_accepted is required');
      });

      it('should reject when terms_accepted is false', () => {
        const data = { ...validAppointmentData, terms_accepted: false };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('must accept the terms and conditions');
      });

      it('should accept when terms_accepted is true', () => {
        const data = { ...validAppointmentData, terms_accepted: true };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should reject when privacy_policy_accepted is missing', () => {
        const { privacy_policy_accepted, ...data } = validAppointmentData;
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('privacy_policy_accepted is required');
      });

      it('should reject when privacy_policy_accepted is false', () => {
        const data = { ...validAppointmentData, privacy_policy_accepted: false };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('must accept the privacy policy');
      });

      it('should accept when privacy_policy_accepted is true', () => {
        const data = { ...validAppointmentData, privacy_policy_accepted: true };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should reject when both terms are not accepted', () => {
        const data = {
          ...validAppointmentData,
          terms_accepted: false,
          privacy_policy_accepted: false,
        };
        const { error } = createAppointmentSchema.validate(data);
        expect(error).toBeDefined();
        // Joi abortEarly is false by default in our validator, but it stops at first validation error per field
        expect(error?.details.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Complete Appointment with All Optional Fields', () => {
      it('should validate appointment with all optional fields', () => {
        const completeData = {
          ...validAppointmentData,
          purchase_timeline: '3 months',
          home_loan_interest: true,
          site_visit_interest: true,
        };
        const { error, value } = createAppointmentSchema.validate(completeData);
        expect(error).toBeUndefined();
        expect(value.purchase_timeline).toBe('3 months');
        expect(value.home_loan_interest).toBe(true);
        expect(value.site_visit_interest).toBe(true);
        expect(value.buyer_name).toBe(validAppointmentData.buyer_name);
      });
    });
  });

  describe('updateAppointmentStatusSchema', () => {
    it('should accept valid status values', () => {
      const validStatuses = [
        APPOINTMENT_STATUS.CONFIRMED,
        APPOINTMENT_STATUS.DECLINED,
        APPOINTMENT_STATUS.CANCELLED,
      ];

      validStatuses.forEach(status => {
        const { error } = updateAppointmentStatusSchema.validate({ status });
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid status values', () => {
      const { error } = updateAppointmentStatusSchema.validate({ status: 'invalid' });
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be one of');
    });

    it('should reject when status is missing', () => {
      const { error } = updateAppointmentStatusSchema.validate({});
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('status is required');
    });

    it('should reject pending status in updates', () => {
      const { error } = updateAppointmentStatusSchema.validate({ status: 'pending' });
      expect(error).toBeDefined();
    });
  });
});
