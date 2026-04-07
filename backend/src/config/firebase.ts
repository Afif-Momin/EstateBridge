import { initializeApp, cert, App, getApps } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Firebase initialization configuration
 */
interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
  storageBucket?: string;
}

/**
 * Firebase initialization options
 */
interface InitializationOptions {
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Custom error class for Firebase initialization errors
 */
export class FirebaseInitializationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'FirebaseInitializationError';
  }
}

/**
 * Singleton class for Firebase Admin SDK initialization
 */
class FirebaseAdmin {
  private static instance: FirebaseAdmin;
  private _app: App | null = null;
  private _auth: Auth | null = null;
  private _db: Firestore | null = null;
  private _storage: Storage | null = null;
  private initializationPromise: Promise<void> | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): FirebaseAdmin {
    if (!FirebaseAdmin.instance) {
      FirebaseAdmin.instance = new FirebaseAdmin();
    }
    return FirebaseAdmin.instance;
  }

  /**
   * Validate required environment variables
   */
  private validateEnvironment(): FirebaseConfig {
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
    ];

    const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);
    
    if (missing.length > 0) {
      throw new FirebaseInitializationError(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }

    return {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 
        `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Initialize Firebase Admin SDK with retry logic
   */
  private async initializeWithRetry(
    config: FirebaseConfig,
    options: InitializationOptions = {}
  ): Promise<void> {
    const { maxRetries = 3, retryDelay = 1000 } = options;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if already initialized
        const existingApps = getApps();
        if (existingApps.length > 0) {
          this._app = existingApps[0];
          console.log('✅ Using existing Firebase Admin SDK instance');
        } else {
          // Initialize new app
          this._app = initializeApp({
            credential: cert({
              projectId: config.projectId,
              privateKey: config.privateKey,
              clientEmail: config.clientEmail,
            }),
            storageBucket: config.storageBucket,
          });
          console.log('✅ Firebase Admin SDK initialized successfully');
        }

        // Initialize services
        this._auth = getAuth(this._app);
        this._db = getFirestore(this._app);
        this._storage = getStorage(this._app);

        // Configure Firestore settings (if available)
        if (typeof this._db.settings === 'function') {
          this._db.settings({
            ignoreUndefinedProperties: true,
          });
        }

        this.isInitialized = true;
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `❌ Firebase initialization attempt ${attempt}/${maxRetries} failed:`,
          error
        );

        if (attempt < maxRetries) {
          const delay = retryDelay * attempt; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new FirebaseInitializationError(
      `Failed to initialize Firebase Admin SDK after ${maxRetries} attempts`,
      lastError || undefined
    );
  }

  /**
   * Initialize Firebase Admin SDK (idempotent)
   */
  public async initialize(options?: InitializationOptions): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = (async () => {
      try {
        const config = this.validateEnvironment();
        await this.initializeWithRetry(config, options);
      } catch (error) {
        this.initializationPromise = null; // Reset to allow retry
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Get Firebase App instance
   */
  public getApp(): App {
    if (!this._app) {
      throw new FirebaseInitializationError(
        'Firebase Admin SDK not initialized. Call initialize() first.'
      );
    }
    return this._app;
  }

  /**
   * Get Firebase Auth instance
   */
  public getAuth(): Auth {
    if (!this._auth) {
      throw new FirebaseInitializationError(
        'Firebase Auth not initialized. Call initialize() first.'
      );
    }
    return this._auth;
  }

  /**
   * Get Firestore instance
   */
  public getFirestore(): Firestore {
    if (!this._db) {
      throw new FirebaseInitializationError(
        'Firestore not initialized. Call initialize() first.'
      );
    }
    return this._db;
  }

  /**
   * Get Firebase Storage instance
   */
  public getStorage(): Storage {
    if (!this._storage) {
      throw new FirebaseInitializationError(
        'Firebase Storage not initialized. Call initialize() first.'
      );
    }
    return this._storage;
  }

  /**
   * Check if Firebase is initialized
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
const firebaseAdmin = FirebaseAdmin.getInstance();

// Auto-initialize on module load (with error handling)
firebaseAdmin.initialize().catch((error) => {
  console.error('❌ Failed to auto-initialize Firebase Admin SDK:', error);
  // Don't throw here - let the application handle initialization errors
});

// Export convenient getter functions
export const getFirebaseApp = (): App => firebaseAdmin.getApp();
export const getFirebaseAuth = (): Auth => firebaseAdmin.getAuth();
export const getFirebaseFirestore = (): Firestore => firebaseAdmin.getFirestore();
export const getFirebaseStorage = (): Storage => firebaseAdmin.getStorage();

// Export for manual initialization if needed
export const initializeFirebase = (options?: InitializationOptions): Promise<void> => 
  firebaseAdmin.initialize(options);

// Export for checking initialization status
export const isFirebaseInitialized = (): boolean => firebaseAdmin.initialized;

// Legacy exports for backward compatibility
export const firebaseApp = firebaseAdmin.getApp;
export const auth = firebaseAdmin.getAuth;
export const db = firebaseAdmin.getFirestore;
export const storage = firebaseAdmin.getStorage;

export default firebaseAdmin;
