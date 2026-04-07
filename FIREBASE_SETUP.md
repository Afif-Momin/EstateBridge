# Firebase Configuration Guide

## Overview

This document provides comprehensive instructions for configuring Firebase for the Estate Bridge MERN platform.

## Firebase Project Information

- **Project ID**: `estate-bridge-project`
- **Project Number**: `735185113867`
- **Region**: Default (us-central1)

## Services Enabled

- ✅ Firebase Authentication (Email/Password)
- ✅ Cloud Firestore (NoSQL Database)
- ✅ Firebase Storage (File Storage)
- ✅ Firebase Analytics (Optional)

## Configuration Files

### 1. Environment Variables

#### Backend (.env)
```env
FIREBASE_PROJECT_ID=estate-bridge-project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@estate-bridge-project.iam.gserviceaccount.com
```

**To get service account credentials:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Extract the values and add to `.env` file

#### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=AIzaSyCznTBnodVvya86Z3sjsIPWfXC3ywF1PVc
VITE_FIREBASE_AUTH_DOMAIN=estate-bridge-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=estate-bridge-project
VITE_FIREBASE_STORAGE_BUCKET=estate-bridge-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=735185113867
VITE_FIREBASE_APP_ID=1:735185113867:web:4fae0f214b961aa499080e
VITE_FIREBASE_MEASUREMENT_ID=G-TTQZSPJE46
```

### 2. Security Rules

#### Firestore Rules (`firestore.rules`)
Located at project root. Deploy with:
```bash
firebase deploy --only firestore:rules
```

Key features:
- Role-based access control (buyer/seller)
- Resource ownership verification
- Input validation on writes
- Read access for authenticated users

#### Storage Rules (`storage.rules`)
Located at project root. Deploy with:
```bash
firebase deploy --only storage:rules
```

Key features:
- Image format validation (JPEG, PNG, WebP)
- File size limits (5MB max)
- Seller-only uploads for property images
- Owner-only deletion

### 3. Firestore Indexes

Indexes are defined in `firestore.indexes.json`. Deploy with:
```bash
firebase deploy --only firestore:indexes
```

Indexes created for:
- Property search by status, region, and price
- Property filtering by seller and creation date
- Appointment queries by buyer/seller and status
- Feedback queries by listing

## Database Schema

### Collections

#### users
```typescript
{
  id: string;              // Firebase Auth UID
  email: string;
  fullName: string;
  role: 'buyer' | 'seller';
  profileImage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### properties
```typescript
{
  id: string;
  title: string;
  description: string;
  price: number;
  region: string;
  address: string;
  propertyType: 'house' | 'apartment' | 'condo' | 'land' | 'commercial';
  status: 'available' | 'under_offer' | 'sold';
  sellerId: string;        // Reference to users collection
  imageUrls: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### appointments
```typescript
{
  id: string;
  listingId: string;       // Reference to properties collection
  buyerId: string;         // Reference to users collection
  sellerId: string;        // Reference to users collection
  requestedDateTime: Timestamp;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### feedback
```typescript
{
  id: string;
  listingId: string;       // Reference to properties collection
  buyerId: string;         // Reference to users collection
  rating: number;          // 1-5
  comment: string;
  createdAt: Timestamp;
}
```

#### regions
```typescript
{
  id: string;
  name: string;
  displayName: string;
  active: boolean;
}
```

## Initial Setup Steps

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase Project

```bash
firebase init
```

Select:
- Firestore
- Storage
- Emulators (optional for local development)

### 4. Deploy Security Rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

### 5. Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

### 6. Seed Initial Data

Seed the regions collection:

```bash
cd backend
npm run seed:regions
```

Add this script to `backend/package.json`:
```json
{
  "scripts": {
    "seed:regions": "ts-node src/scripts/seedRegions.ts"
  }
}
```

## Firebase Authentication Setup

### Enable Email/Password Provider

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Optionally enable "Email link (passwordless sign-in)"

### Configure Authorized Domains

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain (e.g., `estate-bridge.com`)
3. Localhost is already authorized for development

## Firebase Storage Setup

### Folder Structure

```
properties/
  {propertyId}/
    {imageId}.jpg
    {imageId}.png
    {imageId}.webp

users/
  {userId}/
    profile.jpg
```

### CORS Configuration

Create `cors.json`:
```json
[
  {
    "origin": ["http://localhost:5173", "https://your-production-domain.com"],
    "method": ["GET", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS configuration:
```bash
gsutil cors set cors.json gs://estate-bridge-project.appspot.com
```

## Local Development with Emulators

### Start Emulators

```bash
firebase emulators:start
```

This starts:
- Auth Emulator: http://localhost:9099
- Firestore Emulator: http://localhost:8080
- Storage Emulator: http://localhost:9199
- Emulator UI: http://localhost:4000

### Configure App to Use Emulators

Add to your Firebase config (development only):

```typescript
// Frontend
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

// Backend
if (process.env.NODE_ENV === 'development') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
}
```

## Monitoring and Logging

### Firebase Console

Monitor your Firebase services:
- **Authentication**: User sign-ups, sign-ins, and activity
- **Firestore**: Database usage, reads/writes, and performance
- **Storage**: File uploads, downloads, and storage usage
- **Analytics**: User behavior and app performance (if enabled)

### Firestore Usage Limits (Free Tier)

- **Reads**: 50,000 per day
- **Writes**: 20,000 per day
- **Deletes**: 20,000 per day
- **Storage**: 1 GB
- **Network egress**: 10 GB per month

### Storage Usage Limits (Free Tier)

- **Storage**: 5 GB
- **Downloads**: 1 GB per day
- **Uploads**: 1 GB per day

## Security Best Practices

1. **Never commit service account keys** to version control
2. **Use environment variables** for all sensitive configuration
3. **Enable App Check** for production to prevent abuse
4. **Set up billing alerts** to monitor usage
5. **Regularly review security rules** for vulnerabilities
6. **Use Firebase Security Rules Unit Testing** to validate rules
7. **Enable audit logging** for compliance requirements
8. **Implement rate limiting** on the backend API
9. **Use HTTPS only** for all Firebase connections
10. **Rotate service account keys** periodically

## Troubleshooting

### Common Issues

#### 1. Permission Denied Errors

**Cause**: Security rules blocking access

**Solution**: 
- Check Firestore/Storage rules in Firebase Console
- Verify user authentication status
- Confirm user role matches required permissions

#### 2. Missing Index Errors

**Cause**: Composite query without index

**Solution**:
- Click the link in the error message to create index
- Or add index definition to `firestore.indexes.json` and deploy

#### 3. Service Account Authentication Fails

**Cause**: Invalid private key or credentials

**Solution**:
- Verify `.env` file has correct credentials
- Ensure private key includes `\n` characters properly escaped
- Regenerate service account key if needed

#### 4. CORS Errors in Storage

**Cause**: CORS not configured for your domain

**Solution**:
- Update `cors.json` with your domain
- Apply CORS configuration using `gsutil`

#### 5. Emulator Connection Issues

**Cause**: Emulators not running or wrong ports

**Solution**:
- Start emulators with `firebase emulators:start`
- Check `firebase.json` for correct port configuration
- Verify emulator connection code is only in development

## Production Deployment Checklist

- [ ] Service account credentials configured in production environment
- [ ] Frontend environment variables set in hosting platform
- [ ] Security rules deployed and tested
- [ ] Indexes deployed and verified
- [ ] CORS configured for production domain
- [ ] Authorized domains added to Firebase Auth
- [ ] Billing account set up with alerts
- [ ] App Check enabled (recommended)
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented
- [ ] Rate limiting configured on API
- [ ] SSL/TLS certificates configured
- [ ] Performance monitoring enabled

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Security](https://firebase.google.com/docs/storage/security)
- [Firebase Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase Pricing](https://firebase.google.com/pricing)

## Support

For Firebase-specific issues:
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow - Firebase Tag](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase Community Slack](https://firebase.community/)
