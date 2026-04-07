import { getApps, deleteApp } from 'firebase-admin/app';

// Mock Firebase Admin SDK for tests
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  cert: jest.fn(),
  getApps: jest.fn(() => []),
  deleteApp: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      add: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      get: jest.fn(),
    })),
    settings: jest.fn(), // Add settings method
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date()),
    arrayUnion: jest.fn((val) => val),
    arrayRemove: jest.fn((val) => val),
  },
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    createUser: jest.fn(),
    getUserByEmail: jest.fn(),
    verifyIdToken: jest.fn(),
    deleteUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
  })),
}));

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        save: jest.fn(),
        delete: jest.fn(),
        getSignedUrl: jest.fn(),
      })),
      upload: jest.fn(),
    })),
  })),
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Clean up any resources
  const apps = getApps();
  await Promise.all(apps.map((app) => deleteApp(app)));
});
