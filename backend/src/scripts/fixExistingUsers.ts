import { getFirebaseAuth, getFirebaseFirestore } from '../config/firebase';

/**
 * Script to create Firestore documents for existing Firebase Auth users
 * Run with: npx ts-node src/scripts/fixExistingUsers.ts
 */

interface UserToFix {
  email: string;
  fullName: string;
  role: 'buyer' | 'seller';
}

const usersToFix: UserToFix[] = [
  {
    email: 'afif25@gmail.com',
    fullName: 'Afif User',
    role: 'buyer',
  },
  {
    email: 'seller@test.com',
    fullName: 'Test Seller',
    role: 'seller',
  },
];

async function fixExistingUsers() {
  try {
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();

    console.log('🔧 Starting to fix existing users...\n');

    for (const userData of usersToFix) {
      try {
        // Get Firebase Auth user
        const userRecord = await auth.getUserByEmail(userData.email);
        console.log(`✅ Found Firebase Auth user: ${userData.email} (${userRecord.uid})`);

        // Check if Firestore document already exists
        const userDoc = await db.collection('users').doc(userRecord.uid).get();
        
        if (userDoc.exists) {
          console.log(`⚠️  Firestore document already exists for ${userData.email}`);
          console.log(`   Skipping...\n`);
          continue;
        }

        // Create Firestore document
        const now = new Date();
        const userProfile = {
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          createdAt: now,
          updatedAt: now,
        };

        await db.collection('users').doc(userRecord.uid).set(userProfile);
        console.log(`✅ Created Firestore document for ${userData.email}`);
        console.log(`   Role: ${userData.role}`);
        console.log(`   Full Name: ${userData.fullName}\n`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.log(`❌ Firebase Auth user not found: ${userData.email}`);
          console.log(`   Please register this user first.\n`);
        } else {
          console.error(`❌ Error fixing user ${userData.email}:`, error.message);
          console.log('');
        }
      }
    }

    console.log('🎉 Finished fixing existing users!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
fixExistingUsers();
