# Firebase Schema Migration Guide

## Overview

This guide explains how to migrate from the old Firebase schema (separate `buyers` and `sellers` collections) to the new unified schema (single `users` collection with role field).

## Schema Changes

### Old Schema
```
buyers/
  - buy_id, buy_name, buy_email, buy_mobile, buy_address, buy_city, buy_state, buy_country, buy_pincode, buy_createddate

sellers/
  - sell_id, sell_name, sell_email, sell_mobile, sell_address, sell_state, sell_country, sell_pincode, sell_createddate

properties/
  - property_id, sell_email, pro_type, pro_price, pro_status, country, state, description, image_urls, created_at

appointments/
  - appointment_id, buyer_id, buyer_name, seller_id, seller_name, seller_email, property_id, property_type, property_price, status, created_at
```

### New Schema
```
users/
  - id (uid from Firebase Auth), email, fullName, role ('buyer' | 'seller'), profileImage, createdAt, updatedAt

properties/
  - id, title, description, price, region, address, propertyType, status, sellerId, imageUrls, createdAt, updatedAt

appointments/
  - id, listingId, buyerId, sellerId, requestedDateTime, status, createdAt, updatedAt

feedback/
  - id, listingId, buyerId, rating, comment, createdAt

regions/
  - id, name, displayName, active
```

## Migration Steps

### Step 1: Backup Existing Data

Before starting the migration, create a backup of your Firestore database:

```bash
# Using Firebase CLI
firebase firestore:export gs://estate-bridge-project.appspot.com/backups/$(date +%Y%m%d)
```

### Step 2: Create Migration Script

Create a migration script to transform and copy data from old collections to new collections:

```typescript
// backend/src/scripts/migrateSchema.ts

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const db = getFirestore(app);

async function migrateBuyersToUsers() {
  console.log('Migrating buyers to users collection...');
  const buyersSnapshot = await db.collection('buyers').get();
  
  const batch = db.batch();
  let count = 0;

  for (const doc of buyersSnapshot.docs) {
    const buyer = doc.data();
    const userRef = db.collection('users').doc(doc.id);
    
    batch.set(userRef, {
      email: buyer.buy_email,
      fullName: buyer.buy_name,
      role: 'buyer',
      createdAt: buyer.buy_createddate || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    
    count++;
    
    // Commit batch every 500 documents
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Migrated ${count} buyers...`);
    }
  }
  
  await batch.commit();
  console.log(`✅ Migrated ${count} buyers to users collection`);
}

async function migrateSellersToUsers() {
  console.log('Migrating sellers to users collection...');
  const sellersSnapshot = await db.collection('sellers').get();
  
  const batch = db.batch();
  let count = 0;

  for (const doc of sellersSnapshot.docs) {
    const seller = doc.data();
    const userRef = db.collection('users').doc(doc.id);
    
    batch.set(userRef, {
      email: seller.sell_email,
      fullName: seller.sell_name,
      role: 'seller',
      createdAt: seller.sell_createddate || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    
    count++;
    
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Migrated ${count} sellers...`);
    }
  }
  
  await batch.commit();
  console.log(`✅ Migrated ${count} sellers to users collection`);
}

async function migrateProperties() {
  console.log('Migrating properties collection...');
  const propertiesSnapshot = await db.collection('properties').get();
  
  const batch = db.batch();
  let count = 0;

  for (const doc of propertiesSnapshot.docs) {
    const property = doc.data();
    
    // Find seller by email to get sellerId
    const sellerSnapshot = await db.collection('sellers')
      .where('sell_email', '==', property.sell_email)
      .limit(1)
      .get();
    
    if (sellerSnapshot.empty) {
      console.warn(`Seller not found for property ${doc.id}, skipping...`);
      continue;
    }
    
    const sellerId = sellerSnapshot.docs[0].id;
    const propertyRef = db.collection('properties').doc(doc.id);
    
    batch.update(propertyRef, {
      title: property.description?.substring(0, 100) || 'Property Listing',
      description: property.description || '',
      price: property.pro_price || 0,
      region: property.state?.toLowerCase() || 'central',
      address: `${property.state || ''}, ${property.country || ''}`.trim(),
      propertyType: property.pro_type || 'house',
      status: property.pro_status === 'available' ? 'available' : 
              property.pro_status === 'sold' ? 'sold' : 'available',
      sellerId: sellerId,
      imageUrls: property.image_urls || [],
      createdAt: property.created_at || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    count++;
    
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Migrated ${count} properties...`);
    }
  }
  
  await batch.commit();
  console.log(`✅ Migrated ${count} properties`);
}

async function migrateAppointments() {
  console.log('Migrating appointments collection...');
  const appointmentsSnapshot = await db.collection('appointments').get();
  
  const batch = db.batch();
  let count = 0;

  for (const doc of appointmentsSnapshot.docs) {
    const appointment = doc.data();
    const appointmentRef = db.collection('appointments').doc(doc.id);
    
    batch.update(appointmentRef, {
      listingId: appointment.property_id,
      buyerId: appointment.buyer_id,
      sellerId: appointment.seller_id,
      requestedDateTime: appointment.created_at || FieldValue.serverTimestamp(),
      status: appointment.status || 'pending',
      createdAt: appointment.created_at || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    count++;
    
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Migrated ${count} appointments...`);
    }
  }
  
  await batch.commit();
  console.log(`✅ Migrated ${count} appointments`);
}

async function runMigration() {
  try {
    console.log('🚀 Starting schema migration...\n');
    
    await migrateBuyersToUsers();
    await migrateSellersToUsers();
    await migrateProperties();
    await migrateAppointments();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n⚠️  IMPORTANT: Review the migrated data before deleting old collections');
    console.log('⚠️  IMPORTANT: Update Firebase Security Rules after verification');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
```

### Step 3: Run Migration

```bash
cd backend
npm run ts-node src/scripts/migrateSchema.ts
```

### Step 4: Verify Migrated Data

After migration, verify the data in the new collections:

1. Check that all buyers and sellers are in the `users` collection with correct roles
2. Verify that properties have the correct `sellerId` references
3. Confirm appointments have correct `listingId`, `buyerId`, and `sellerId` references
4. Test queries to ensure indexes are working correctly

### Step 5: Deploy New Security Rules

Once data is verified, deploy the new security rules:

```bash
firebase deploy --only firestore:rules,storage:rules
```

### Step 6: Deploy Indexes

Deploy the new Firestore indexes:

```bash
firebase deploy --only firestore:indexes
```

### Step 7: Update Application Code

Ensure all application code is updated to use the new schema:

- Update all Firestore queries to use new collection names and field names
- Update TypeScript interfaces to match new schema
- Update API endpoints to work with new data structure
- Update frontend components to display new field names

### Step 8: Archive Old Collections (Optional)

After verifying everything works correctly, you can archive the old collections:

```bash
# Export old collections for archival
firebase firestore:export gs://estate-bridge-project.appspot.com/archives/old-schema

# Delete old collections (use with caution!)
# This should be done manually through Firebase Console or a script
```

## Rollback Plan

If issues occur during migration:

1. Stop the application
2. Restore from backup:
   ```bash
   firebase firestore:import gs://estate-bridge-project.appspot.com/backups/YYYYMMDD
   ```
3. Revert security rules to old version
4. Investigate and fix issues before retrying

## Testing Checklist

- [ ] Backup created successfully
- [ ] Migration script tested on development environment
- [ ] All users migrated correctly with proper roles
- [ ] All properties have valid sellerId references
- [ ] All appointments have valid references
- [ ] Security rules deployed and tested
- [ ] Indexes deployed and queries working
- [ ] Application tested end-to-end
- [ ] Performance verified (query times acceptable)
- [ ] Old collections archived

## Support

If you encounter issues during migration, check:

1. Firebase Console for error messages
2. Application logs for query errors
3. Security rules for access denied errors
4. Indexes for query performance issues

## Notes

- The migration can be run multiple times (uses merge: true)
- Old collections are not automatically deleted for safety
- Monitor Firestore usage during migration for quota limits
- Consider running migration during low-traffic periods
