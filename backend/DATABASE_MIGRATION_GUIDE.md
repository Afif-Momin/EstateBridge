# Database Migration Guide - Platform Enhancements

This guide documents the database schema changes introduced by the platform enhancements feature and provides migration instructions.

## Overview

The platform enhancements introduce several new collections and updates to existing collections in Firebase Firestore. This guide will help you migrate your existing database to support the new features.

## New Collections

### 1. verification_tokens

Stores email verification tokens for user registration.

**Collection Path**: `verification_tokens`

**Document Structure**:
```typescript
{
  id: string;                    // Auto-generated document ID
  userId: string;                // Reference to user ID
  token: string;                 // Verification token (32-byte random hex)
  expiresAt: Timestamp;          // Token expiration (24 hours from creation)
  used: boolean;                 // Whether token has been used
  createdAt: Timestamp;          // Token creation timestamp
}
```

**Indexes Required**:
- Single field index on `userId` (ascending)
- Single field index on `token` (ascending)
- Composite index on `expiresAt` (ascending) + `used` (ascending)

**Security Rules**:
```javascript
match /verification_tokens/{tokenId} {
  // Only backend can read/write
  allow read, write: if false;
}
```

### 2. property_reports

Stores user reports for suspicious or inappropriate property listings.

**Collection Path**: `property_reports`

**Document Structure**:
```typescript
{
  id: string;                    // Auto-generated document ID
  propertyId: string;            // Reference to property ID
  reporterId: string;            // User who submitted the report
  reason: string;                // Report reason enum
  additionalDetails?: string;    // Optional additional context
  status: string;                // 'pending' | 'reviewed' | 'dismissed'
  reviewedBy?: string;           // Admin who reviewed (if reviewed)
  reviewedAt?: Timestamp;        // Review timestamp
  createdAt: Timestamp;          // Report submission timestamp
}
```

**Indexes Required**:
- Composite index on `propertyId` (ascending) + `status` (ascending) + `createdAt` (descending)
- Composite index on `status` (ascending) + `createdAt` (descending)

**Security Rules**:
```javascript
match /property_reports/{reportId} {
  // Users can create reports
  allow create: if request.auth != null;
  // Only admins can read/update
  allow read, update: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### 3. rate_limits

Stores rate limiting data for various operations (registration, property creation, appointments).

**Collection Path**: `rate_limits`

**Document Structure**:
```typescript
{
  id: string;                    // Auto-generated document ID
  identifier: string;            // IP address or user ID
  type: string;                  // 'registration' | 'property_creation' | 'appointment_request'
  count: number;                 // Number of attempts
  resetAt: Timestamp;            // When the counter resets
  createdAt: Timestamp;          // First attempt timestamp
  updatedAt: Timestamp;          // Last attempt timestamp
}
```

**Indexes Required**:
- Composite index on `identifier` (ascending) + `type` (ascending)
- Single field index on `resetAt` (ascending)

**Security Rules**:
```javascript
match /rate_limits/{limitId} {
  // Only backend can read/write
  allow read, write: if false;
}
```

### 4. brochures

Stores metadata for generated PDF brochures.

**Collection Path**: `brochures`

**Document Structure**:
```typescript
{
  id: string;                    // Auto-generated document ID
  propertyId: string;            // Reference to property ID
  generatedBy: string;           // User who generated the brochure
  fileUrl: string;               // Signed URL to PDF file
  fileName: string;              // PDF filename
  fileSize: number;              // File size in bytes
  expiresAt: Timestamp;          // URL expiration (1 hour from generation)
  createdAt: Timestamp;          // Generation timestamp
}
```

**Indexes Required**:
- Single field index on `propertyId` (ascending)
- Single field index on `expiresAt` (ascending)

**Security Rules**:
```javascript
match /brochures/{brochureId} {
  // Authenticated users can read
  allow read: if request.auth != null;
  // Only backend can write
  allow write: if false;
}
```

## Updated Collections

### 1. users (buyers and sellers)

**New Fields Added**:
```typescript
{
  // Location fields
  buy_country?: string;          // Country code (ISO format)
  buy_city?: string;             // City name
  buy_state?: string;            // State/province name
  buy_address?: string;          // Street address
  buy_pincode?: string;          // Postal/ZIP code
  
  // Email verification fields
  emailVerified: boolean;        // Email verification status (default: false)
  emailVerificationToken?: string;     // Current verification token
  emailVerificationTokenExpiry?: Timestamp;  // Token expiration
  
  // Currency field
  currency: 'USD' | 'INR';       // User's currency based on country
}
```

**Migration Script**:
```typescript
// Run this script to add new fields to existing users
// File: backend/src/scripts/migrateUsers.ts

import { firebaseAdmin } from '../config/firebase';

async function migrateUsers() {
  const db = firebaseAdmin.firestore();
  
  // Migrate buyers
  const buyersSnapshot = await db.collection('buyers').get();
  for (const doc of buyersSnapshot.docs) {
    await doc.ref.update({
      emailVerified: false,
      currency: 'USD',  // Default to USD, update based on your needs
      buy_country: '',
      buy_city: '',
      buy_state: '',
      buy_address: '',
      buy_pincode: ''
    });
  }
  
  // Migrate sellers
  const sellersSnapshot = await db.collection('sellers').get();
  for (const doc of sellersSnapshot.docs) {
    await doc.ref.update({
      emailVerified: false,
      currency: 'USD',  // Default to USD, update based on your needs
      buy_country: '',
      buy_city: '',
      buy_state: '',
      buy_address: '',
      buy_pincode: ''
    });
  }
  
  console.log('User migration complete');
}

migrateUsers().catch(console.error);
```

### 2. properties

**New Fields Added**:
```typescript
{
  // Status fields
  pro_status: 'For Sale' | 'For Rent' | 'Under Construction' | 
              'Closed' | 'Finished' | 'Waiting for Admin Approval' | 'Rejected';
  added_by_broker: boolean;      // Whether added by a broker
  
  // Currency field
  currency: 'USD' | 'INR';       // Property currency
  
  // Spam detection fields
  flagged: boolean;              // Whether property is flagged as suspicious
  flaggedReason?: string;        // Reason for flagging
  flaggedAt?: Timestamp;         // When property was flagged
  reportCount: number;           // Number of user reports (default: 0)
  
  // Admin approval fields
  approvedBy?: string;           // Admin who approved
  approvedAt?: Timestamp;        // Approval timestamp
  rejectedBy?: string;           // Admin who rejected
  rejectedAt?: Timestamp;        // Rejection timestamp
  rejectionReason?: string;      // Reason for rejection
  
  // Image optimization fields
  thumbnailUrls: string[];       // Thumbnail image URLs (400px width)
}
```

**Migration Script**:
```typescript
// Run this script to add new fields to existing properties
// File: backend/src/scripts/migrateProperties.ts

import { firebaseAdmin } from '../config/firebase';

async function migrateProperties() {
  const db = firebaseAdmin.firestore();
  
  const propertiesSnapshot = await db.collection('properties').get();
  
  for (const doc of propertiesSnapshot.docs) {
    const data = doc.data();
    
    await doc.ref.update({
      pro_status: 'For Sale',  // Default status, update based on your needs
      added_by_broker: false,
      currency: 'USD',  // Default to USD, update based on seller's country
      flagged: false,
      reportCount: 0,
      thumbnailUrls: []  // Will be populated when images are re-uploaded
    });
  }
  
  console.log('Property migration complete');
}

migrateProperties().catch(console.error);
```

### 3. appointments (buyer_interests)

**New Fields Added**:
```typescript
{
  // Buyer qualification fields
  reason_to_buy: 'Investment' | 'Self Use';
  is_property_dealer: boolean;
  buyer_name: string;
  buyer_phone: string;
  
  // Optional qualification fields
  purchase_timeline?: 'Immediate' | '1-3 months' | '3-6 months' | '6+ months';
  home_loan_interest?: boolean;
  site_visit_interest?: boolean;
  
  // Terms acceptance
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
  
  // Contact revelation tracking
  contact_revealed: boolean;     // Whether seller contact was revealed
  contact_revealed_at?: Timestamp;  // When contact was revealed
}
```

**Migration Script**:
```typescript
// Run this script to add new fields to existing appointments
// File: backend/src/scripts/migrateAppointments.ts

import { firebaseAdmin } from '../config/firebase';

async function migrateAppointments() {
  const db = firebaseAdmin.firestore();
  
  const appointmentsSnapshot = await db.collection('buyer_interests').get();
  
  for (const doc of appointmentsSnapshot.docs) {
    await doc.ref.update({
      reason_to_buy: 'Self Use',  // Default value
      is_property_dealer: false,
      buyer_name: '',  // Will need to be filled by users
      buyer_phone: '',  // Will need to be filled by users
      terms_accepted: true,  // Assume existing appointments accepted terms
      privacy_policy_accepted: true,
      contact_revealed: true,  // Existing appointments already have contact
      contact_revealed_at: doc.data().createdAt || new Date()
    });
  }
  
  console.log('Appointment migration complete');
}

migrateAppointments().catch(console.error);
```

## Firestore Indexes

Deploy these composite indexes using `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "properties",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "buy_country", "order": "ASCENDING" },
        { "fieldPath": "buy_city", "order": "ASCENDING" },
        { "fieldPath": "pro_status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "properties",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "pro_status", "order": "ASCENDING" },
        { "fieldPath": "propertyType", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "properties",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "flagged", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "property_reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "propertyId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "buyer_interests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "buyerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "buyer_interests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sellerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

## Firebase Storage Rules

Update `storage.rules` to include new security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Property images - authenticated users can upload
    match /properties/{propertyId}/{imageId} {
      allow read: if true;  // Public read
      allow write: if request.auth != null && request.resource.size < 10 * 1024 * 1024;  // 10MB limit
    }
    
    // Brochures - authenticated users can read
    match /brochures/{propertyId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if false;  // Only backend can write
    }
  }
}
```

Deploy storage rules:
```bash
firebase deploy --only storage
```

## Migration Steps

### Step 1: Backup Your Database

Before making any changes, create a backup of your Firestore database:

```bash
# Using Firebase CLI
firebase firestore:export gs://your-bucket-name/backups/$(date +%Y%m%d)
```

### Step 2: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Step 3: Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### Step 4: Deploy Storage Rules

```bash
firebase deploy --only storage
```

### Step 5: Run Migration Scripts

```bash
# Migrate users
npm run ts-node src/scripts/migrateUsers.ts

# Migrate properties
npm run ts-node src/scripts/migrateProperties.ts

# Migrate appointments
npm run ts-node src/scripts/migrateAppointments.ts
```

### Step 6: Verify Migration

1. Check that all collections have the new fields
2. Verify that indexes are being built (check Firebase Console)
3. Test key features:
   - User registration with location data
   - Email verification flow
   - Property creation with admin approval
   - Brochure generation
   - User reporting system

### Step 7: Monitor for Issues

- Check application logs for any errors
- Monitor Firestore usage for unexpected spikes
- Verify that rate limiting is working correctly

## Rollback Plan

If you need to rollback:

1. Restore from backup:
```bash
firebase firestore:import gs://your-bucket-name/backups/YYYYMMDD
```

2. Revert Firestore rules and indexes to previous versions

3. Redeploy the previous version of your application

## Notes

- The migration scripts are idempotent and can be run multiple times safely
- Existing data will not be deleted, only new fields will be added
- Users will need to update their profiles with location data on next login
- Properties created before migration will default to "For Sale" status
- Thumbnail URLs will be empty until images are re-uploaded or regenerated

## Support

If you encounter issues during migration:
1. Check the application logs for detailed error messages
2. Verify that all environment variables are correctly configured
3. Ensure Firebase project has sufficient quota for the operations
4. Contact the development team for assistance
