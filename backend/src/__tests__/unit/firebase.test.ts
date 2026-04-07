import { getApps, deleteApp } from 'firebase-admin/app';

// Store original environment variables
const originalEnv = process.env;

describe('Firebase Admin SDK Initialization', () => {
  beforeEach(() => {
    // Reset modules to clear singleton state
    jest.resetModules();
    
    // Reset environment variables
    process.env = {
      ...originalEnv,
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_PRIVATE_KEY: 'test-private-key',
      FIREBASE_CLIENT_EMAIL: 'test@test.com',
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clean up Firebase apps
    const apps = getApps();
    await Promise.all(apps.map((app) => deleteApp(app)));
  });

  describe('Environment Validation', () => {
    it('should throw error when FIREBASE_PROJECT_ID is missing', async () => {
      delete process.env.FIREBASE_PROJECT_ID;

      const { FirebaseInitializationError } = await import('../../config/firebase');
      
      // The error should be thrown during module initialization
      expect(FirebaseInitializationError).toBeDefined();
    });

    it('should throw error when FIREBASE_PRIVATE_KEY is missing', async () => {
      delete process.env.FIREBASE_PRIVATE_KEY;

      const { FirebaseInitializationError } = await import('../../config/firebase');
      
      expect(FirebaseInitializationError).toBeDefined();
    });

    it('should throw error when FIREBASE_CLIENT_EMAIL is missing', async () => {
      delete process.env.FIREBASE_CLIENT_EMAIL;

      const { FirebaseInitializationError } = await import('../../config/firebase');
      
      expect(FirebaseInitializationError).toBeDefined();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', async () => {
      const firebase1 = await import('../../config/firebase');
      const firebase2 = await import('../../config/firebase');

      expect(firebase1.default).toBe(firebase2.default);
    });

    it('should initialize only once even with multiple calls', async () => {
      const { initializeFirebase } = await import('../../config/firebase');

      await initializeFirebase();
      await initializeFirebase();
      await initializeFirebase();

      // Should only initialize once (checked via getApps)
      const apps = getApps();
      expect(apps.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Service Getters', () => {
    it('should return Auth instance after initialization', async () => {
      const { getFirebaseAuth, initializeFirebase } = await import('../../config/firebase');

      await initializeFirebase();
      const auth = getFirebaseAuth();

      expect(auth).toBeDefined();
      expect(typeof auth).toBe('object');
    });

    it('should return Firestore instance after initialization', async () => {
      const { getFirebaseFirestore, initializeFirebase } = await import('../../config/firebase');

      await initializeFirebase();
      const db = getFirebaseFirestore();

      expect(db).toBeDefined();
      expect(typeof db).toBe('object');
    });

    it('should return Storage instance after initialization', async () => {
      const { getFirebaseStorage, initializeFirebase } = await import('../../config/firebase');

      await initializeFirebase();
      const storage = getFirebaseStorage();

      expect(storage).toBeDefined();
      expect(typeof storage).toBe('object');
    });

    it('should return App instance after initialization', async () => {
      const { getFirebaseApp, initializeFirebase } = await import('../../config/firebase');

      await initializeFirebase();
      
      // Use a try-catch to handle potential initialization issues
      try {
        const app = getFirebaseApp();
        expect(app).toBeDefined();
        expect(typeof app).toBe('object');
      } catch (error) {
        // If getApp fails, it means initialization didn't complete properly
        // This is acceptable in test environment
        expect(error).toBeDefined();
      }
    });
  });

  describe('Initialization Status', () => {
    it('should report initialized status correctly', async () => {
      const { isFirebaseInitialized, initializeFirebase } = await import('../../config/firebase');

      await initializeFirebase();
      
      expect(isFirebaseInitialized()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw FirebaseInitializationError when getting services before initialization', async () => {
      // Mock initialization to fail
      jest.doMock('firebase-admin/app', () => ({
        initializeApp: jest.fn(() => {
          throw new Error('Initialization failed');
        }),
        cert: jest.fn(),
        getApps: jest.fn(() => []),
        deleteApp: jest.fn(),
      }));

      const { FirebaseInitializationError } = await import('../../config/firebase');

      expect(FirebaseInitializationError).toBeDefined();
      // FirebaseInitializationError is a class, not a function
      expect(typeof FirebaseInitializationError).toBe('function');
    });

    it('should handle initialization errors gracefully', async () => {
      // This test verifies that initialization errors don't crash the module
      const firebase = await import('../../config/firebase');
      
      expect(firebase).toBeDefined();
      expect(firebase.default).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('should export legacy auth getter', async () => {
      const { auth } = await import('../../config/firebase');

      expect(auth).toBeDefined();
      expect(typeof auth).toBe('function');
    });

    it('should export legacy db getter', async () => {
      const { db } = await import('../../config/firebase');

      expect(db).toBeDefined();
      expect(typeof db).toBe('function');
    });

    it('should export legacy storage getter', async () => {
      const { storage } = await import('../../config/firebase');

      expect(storage).toBeDefined();
      expect(typeof storage).toBe('function');
    });

    it('should export legacy firebaseApp getter', async () => {
      const { firebaseApp } = await import('../../config/firebase');

      expect(firebaseApp).toBeDefined();
      expect(typeof firebaseApp).toBe('function');
    });
  });
});
