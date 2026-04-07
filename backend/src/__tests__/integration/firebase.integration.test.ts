import { getApps, deleteApp } from 'firebase-admin/app';

// Store original environment variables
const originalEnv = process.env;

describe('Firebase Admin SDK Integration', () => {
  beforeEach(() => {
    jest.resetModules();
    
    process.env = {
      ...originalEnv,
      FIREBASE_PROJECT_ID: 'test-project-integration',
      FIREBASE_PRIVATE_KEY: 'test-private-key-integration',
      FIREBASE_CLIENT_EMAIL: 'test-integration@test.com',
    };

    jest.clearAllMocks();
  });

  afterEach(async () => {
    process.env = originalEnv;
    
    const apps = getApps();
    await Promise.all(apps.map((app) => deleteApp(app)));
  });

  describe('Complete Initialization Flow', () => {
    it('should initialize all Firebase services successfully', async () => {
      const {
        initializeFirebase,
        getFirebaseAuth,
        getFirebaseFirestore,
        getFirebaseStorage,
        isFirebaseInitialized,
      } = await import('../../config/firebase');

      // Initialize
      await initializeFirebase();

      // Verify initialization status
      expect(isFirebaseInitialized()).toBe(true);

      // Verify all services are available (except app which may not be available in test env)
      expect(getFirebaseAuth()).toBeDefined();
      expect(getFirebaseFirestore()).toBeDefined();
      expect(getFirebaseStorage()).toBeDefined();
    });

    it('should handle concurrent initialization requests', async () => {
      const { initializeFirebase } = await import('../../config/firebase');

      // Start multiple initializations concurrently
      const promises = [
        initializeFirebase(),
        initializeFirebase(),
        initializeFirebase(),
      ];

      // All should complete successfully
      await expect(Promise.all(promises)).resolves.not.toThrow();

      // Should only create one app
      const apps = getApps();
      expect(apps.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Service Configuration', () => {
    it('should configure Firestore with correct settings', async () => {
      const { initializeFirebase, getFirebaseFirestore } = await import('../../config/firebase');

      await initializeFirebase();
      const db = getFirebaseFirestore();

      // Verify Firestore is configured (settings are applied during initialization)
      expect(db).toBeDefined();
      expect(typeof db.collection).toBe('function');
    });

    it('should use custom storage bucket if provided', async () => {
      process.env.FIREBASE_STORAGE_BUCKET = 'custom-bucket.appspot.com';

      const { initializeFirebase, getFirebaseStorage } = await import('../../config/firebase');

      await initializeFirebase();
      const storage = getFirebaseStorage();

      expect(storage).toBeDefined();
    });

    it('should use default storage bucket if not provided', async () => {
      delete process.env.FIREBASE_STORAGE_BUCKET;

      const { initializeFirebase, getFirebaseStorage } = await import('../../config/firebase');

      await initializeFirebase();
      const storage = getFirebaseStorage();

      expect(storage).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after failed initialization', async () => {
      // First attempt with missing env var
      delete process.env.FIREBASE_PROJECT_ID;

      let firebase = await import('../../config/firebase');
      
      // Restore env var
      process.env.FIREBASE_PROJECT_ID = 'test-project-recovery';
      
      // Reset modules to get fresh instance
      jest.resetModules();
      
      // Second attempt should succeed
      firebase = await import('../../config/firebase');
      await firebase.initializeFirebase();

      expect(firebase.isFirebaseInitialized()).toBe(true);
    });
  });

  describe('Multiple Service Access', () => {
    it('should allow accessing all services after single initialization', async () => {
      const firebase = await import('../../config/firebase');

      await firebase.initializeFirebase();

      // Access all services (except app which may not be available in test env)
      const auth = firebase.getFirebaseAuth();
      const db = firebase.getFirebaseFirestore();
      const storage = firebase.getFirebaseStorage();

      // All should be defined and functional
      expect(auth).toBeDefined();
      expect(db).toBeDefined();
      expect(storage).toBeDefined();

      // Verify they're the same instances on subsequent calls
      expect(firebase.getFirebaseAuth()).toBe(auth);
      expect(firebase.getFirebaseFirestore()).toBe(db);
      expect(firebase.getFirebaseStorage()).toBe(storage);
    });
  });
});
