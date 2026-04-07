import { dashboardService } from '../../services/dashboardService';

jest.mock('../../config/firebase', () => ({
  getFirebaseFirestore: jest.fn(),
}));

import { getFirebaseFirestore } from '../../config/firebase';

// Helper to build a mock Firestore snapshot
function makeSnap(docs: any[] = [], size?: number) {
  return {
    size: size ?? docs.length,
    docs: docs.map((d, i) => ({
      id: `doc-${i}`,
      data: () => d,
    })),
  };
}

// Build a chainable query mock that resolves to a given snap
function makeQuery(snap: any) {
  const q: any = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue(snap),
  };
  return q;
}

describe('dashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSellerDashboard', () => {
    it('returns correct statistics for a seller', async () => {
      const now = new Date();
      const apptData = {
        listingId: 'p1',
        buyerId: 'b1',
        sellerId: 'seller-1',
        requestedDateTime: { toDate: () => now },
        status: 'pending',
        createdAt: { toDate: () => now },
        updatedAt: { toDate: () => now },
      };
      const propData = {
        title: 'Test Property',
        sellerId: 'seller-1',
        status: 'available',
        createdAt: { toDate: () => now },
        updatedAt: { toDate: () => now },
      };

      // Each call to collection() returns a fresh query mock
      // We need to track which query is which by the where() calls
      // Simplest approach: return a query that always resolves to a "full" snap
      // and verify counts via the snap sizes
      const snaps = [
        makeSnap([propData, propData, propData], 3), // allListings (no status filter)
        makeSnap([propData, propData], 2),            // activeListings (status=available)
        makeSnap([apptData], 1),                      // pendingAppts
        makeSnap([], 0),                              // confirmedAppts
        makeSnap([apptData], 1),                      // recentAppts (ordered)
        makeSnap([propData, propData], 2),            // recentListings (ordered)
      ];

      let snapIdx = 0;
      const mockDb = {
        collection: jest.fn().mockImplementation(() => {
          const snap = snaps[snapIdx++] ?? makeSnap([]);
          return makeQuery(snap);
        }),
      };
      (getFirebaseFirestore as jest.Mock).mockReturnValue(mockDb);

      const result = await dashboardService.getSellerDashboard('seller-1');

      expect(result.totalListings).toBe(3);
      expect(result.activeListings).toBe(2);
      expect(result.pendingAppointments).toBe(1);
      expect(result.confirmedAppointments).toBe(0);
      expect(result.recentAppointments).toHaveLength(1);
      expect(result.recentListings).toHaveLength(2);
    });

    it('returns zeros when seller has no data', async () => {
      const mockDb = {
        collection: jest.fn().mockImplementation(() => makeQuery(makeSnap([], 0))),
      };
      (getFirebaseFirestore as jest.Mock).mockReturnValue(mockDb);

      const result = await dashboardService.getSellerDashboard('seller-empty');

      expect(result.totalListings).toBe(0);
      expect(result.activeListings).toBe(0);
      expect(result.pendingAppointments).toBe(0);
      expect(result.confirmedAppointments).toBe(0);
      expect(result.recentAppointments).toHaveLength(0);
      expect(result.recentListings).toHaveLength(0);
    });

    it('throws DatabaseError on Firestore failure', async () => {
      const failQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error('Firestore error')),
      };
      const mockDb = { collection: jest.fn().mockReturnValue(failQuery) };
      (getFirebaseFirestore as jest.Mock).mockReturnValue(mockDb);

      await expect(dashboardService.getSellerDashboard('seller-1')).rejects.toThrow(
        'Failed to fetch seller dashboard'
      );
    });
  });

  describe('getBuyerDashboard', () => {
    it('returns correct statistics for a buyer', async () => {
      const now = new Date();
      const apptData = {
        listingId: 'p1',
        buyerId: 'buyer-1',
        sellerId: 's1',
        requestedDateTime: { toDate: () => now },
        status: 'pending',
        createdAt: { toDate: () => now },
        updatedAt: { toDate: () => now },
      };

      const snaps = [
        makeSnap([apptData, apptData], 2), // allAppts
        makeSnap([apptData], 1),            // pendingAppts
        makeSnap([], 0),                    // confirmedAppts
        makeSnap([apptData], 1),            // recentAppts
        makeSnap([{}, {}], 2),              // feedback
      ];

      let snapIdx = 0;
      const mockDb = {
        collection: jest.fn().mockImplementation(() => {
          const snap = snaps[snapIdx++] ?? makeSnap([]);
          return makeQuery(snap);
        }),
      };
      (getFirebaseFirestore as jest.Mock).mockReturnValue(mockDb);

      const result = await dashboardService.getBuyerDashboard('buyer-1');

      expect(result.totalAppointments).toBe(2);
      expect(result.pendingAppointments).toBe(1);
      expect(result.confirmedAppointments).toBe(0);
      expect(result.recentAppointments).toHaveLength(1);
      expect(result.submittedFeedback).toBe(2);
    });

    it('returns zeros when buyer has no data', async () => {
      const mockDb = {
        collection: jest.fn().mockImplementation(() => makeQuery(makeSnap([], 0))),
      };
      (getFirebaseFirestore as jest.Mock).mockReturnValue(mockDb);

      const result = await dashboardService.getBuyerDashboard('buyer-empty');

      expect(result.totalAppointments).toBe(0);
      expect(result.pendingAppointments).toBe(0);
      expect(result.confirmedAppointments).toBe(0);
      expect(result.recentAppointments).toHaveLength(0);
      expect(result.submittedFeedback).toBe(0);
    });

    it('throws DatabaseError on Firestore failure', async () => {
      const failQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error('Firestore error')),
      };
      const mockDb = { collection: jest.fn().mockReturnValue(failQuery) };
      (getFirebaseFirestore as jest.Mock).mockReturnValue(mockDb);

      await expect(dashboardService.getBuyerDashboard('buyer-1')).rejects.toThrow(
        'Failed to fetch buyer dashboard'
      );
    });
  });
});
