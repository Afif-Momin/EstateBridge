# Firebase Service Account Setup Guide

## Overview

This guide explains how to generate and configure Firebase service account credentials for the Estate Bridge backend.

## What is a Service Account?

A service account is a special type of account used by applications (not humans) to authenticate with Firebase Admin SDK. It provides server-side access to Firebase services with elevated privileges.

## Step-by-Step Setup

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **estate-bridge-project**

### Step 2: Navigate to Service Accounts

1. Click the gear icon (⚙️) next to "Project Overview"
2. Select **Project settings**
3. Click on the **Service accounts** tab

### Step 3: Generate Private Key

1. Scroll down to the "Firebase Admin SDK" section
2. Select **Node.js** as the language
3. Click **Generate new private key**
4. A dialog will appear warning you to keep the key secure
5. Click **Generate key**
6. A JSON file will be downloaded to your computer

### Step 4: Extract Credentials

Open the downloaded JSON file. It will look like this:

```json
{
  "type": "service_account",
  "project_id": "estate-bridge-project",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@estate-bridge-project.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Step 5: Update Backend .env File

Extract the following values from the JSON file and add them to `backend/.env`:

```env
FIREBASE_PROJECT_ID=estate-bridge-project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@estate-bridge-project.iam.gserviceaccount.com
```

**Important Notes:**
- Keep the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters in the private key (they represent line breaks)
- Wrap the private key in double quotes
- The private key should be one long line with `\n` characters, not multiple lines

### Step 6: Verify Configuration

Test your configuration by running:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Firebase Admin SDK initialized successfully
```

If you see an error, check:
1. All three environment variables are set correctly
2. The private key includes the BEGIN and END markers
3. The private key is wrapped in double quotes
4. No extra spaces or line breaks in the .env file

## Security Best Practices

### 1. Never Commit Service Account Keys

Add to `.gitignore`:
```
# Environment files with secrets
.env
.env.local
.env.production

# Service account keys
*-firebase-adminsdk-*.json
serviceAccountKey.json
```

### 2. Use Different Service Accounts for Different Environments

Create separate service accounts for:
- **Development**: Limited permissions, used locally
- **Staging**: Similar to production, used in staging environment
- **Production**: Full permissions, used in production only

### 3. Rotate Keys Regularly

1. Generate a new service account key
2. Update your production environment variables
3. Test that the new key works
4. Delete the old key from Firebase Console

### 4. Limit Service Account Permissions

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Find your Firebase service account
5. Edit permissions to grant only necessary roles

Recommended roles:
- Firebase Admin SDK Administrator Service Agent
- Cloud Datastore User
- Storage Object Admin

### 5. Use Secret Management in Production

For production deployments, use a secret management service:

#### Google Cloud Secret Manager
```bash
# Store secret
gcloud secrets create firebase-private-key --data-file=serviceAccountKey.json

# Access in Cloud Run/Cloud Functions
gcloud secrets versions access latest --secret="firebase-private-key"
```

#### AWS Secrets Manager
```bash
# Store secret
aws secretsmanager create-secret --name firebase-private-key --secret-string file://serviceAccountKey.json

# Access in application
const secret = await secretsManager.getSecretValue({ SecretId: 'firebase-private-key' }).promise();
```

#### Environment Variables in Hosting Platforms

**Vercel:**
```bash
vercel env add FIREBASE_PRIVATE_KEY
```

**Heroku:**
```bash
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Netlify:**
```bash
netlify env:set FIREBASE_PRIVATE_KEY "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Troubleshooting

### Error: "Failed to parse private key"

**Cause**: Private key format is incorrect

**Solution**:
1. Ensure the private key includes BEGIN and END markers
2. Keep all `\n` characters in the key
3. Wrap the entire key in double quotes
4. Don't add extra line breaks

### Error: "Invalid service account"

**Cause**: Wrong project ID or client email

**Solution**:
1. Verify `FIREBASE_PROJECT_ID` matches your Firebase project
2. Verify `FIREBASE_CLIENT_EMAIL` is from the correct service account
3. Regenerate the service account key if needed

### Error: "Permission denied"

**Cause**: Service account lacks necessary permissions

**Solution**:
1. Go to Google Cloud Console → IAM & Admin
2. Find your service account
3. Add required roles (Firebase Admin, Datastore User, Storage Admin)

### Error: "Service account key expired"

**Cause**: Service account key was deleted or expired

**Solution**:
1. Generate a new service account key
2. Update environment variables
3. Restart your application

## Testing Service Account

Create a test script to verify your service account works:

```typescript
// backend/src/scripts/testServiceAccount.ts

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

async function testServiceAccount() {
  try {
    console.log('Testing Firebase service account...\n');

    // Initialize Firebase
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    console.log('✅ Firebase Admin SDK initialized');

    // Test Auth
    const auth = getAuth(app);
    const users = await auth.listUsers(1);
    console.log('✅ Firebase Auth access verified');

    // Test Firestore
    const db = getFirestore(app);
    const snapshot = await db.collection('users').limit(1).get();
    console.log('✅ Firestore access verified');

    console.log('\n🎉 Service account is configured correctly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Service account test failed:', error);
    process.exit(1);
  }
}

testServiceAccount();
```

Run the test:
```bash
npm run ts-node src/scripts/testServiceAccount.ts
```

## Additional Resources

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Service Account Documentation](https://cloud.google.com/iam/docs/service-accounts)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/security)
- [Google Cloud IAM Roles](https://cloud.google.com/iam/docs/understanding-roles)

## Need Help?

If you're still having issues:
1. Check the [Firebase Status Dashboard](https://status.firebase.google.com/)
2. Review [Firebase Support Documentation](https://firebase.google.com/support)
3. Ask on [Stack Overflow with firebase tag](https://stackoverflow.com/questions/tagged/firebase)
4. Contact your team lead or DevOps engineer
