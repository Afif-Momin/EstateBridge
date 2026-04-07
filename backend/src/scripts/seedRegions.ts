import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const db = getFirestore(app);

// Seed regions data
const regions = [
  {
    id: 'north',
    name: 'north',
    displayName: 'North Region',
    active: true,
  },
  {
    id: 'south',
    name: 'south',
    displayName: 'South Region',
    active: true,
  },
  {
    id: 'east',
    name: 'east',
    displayName: 'East Region',
    active: true,
  },
  {
    id: 'west',
    name: 'west',
    displayName: 'West Region',
    active: true,
  },
  {
    id: 'central',
    name: 'central',
    displayName: 'Central Region',
    active: true,
  },
];

async function seedRegions() {
  try {
    console.log('Starting regions seed...');

    const batch = db.batch();

    for (const region of regions) {
      const regionRef = db.collection('regions').doc(region.id);
      batch.set(regionRef, region, { merge: true });
      console.log(`Added region: ${region.displayName}`);
    }

    await batch.commit();
    console.log('✅ Regions seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding regions:', error);
    process.exit(1);
  }
}

seedRegions();
