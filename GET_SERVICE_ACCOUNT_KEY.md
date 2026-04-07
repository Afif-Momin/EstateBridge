# How to Get Your Firebase Service Account Key

## Quick Steps

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/estate-bridge-project/settings/serviceaccounts/adminsdk

2. **Generate New Private Key**
   - Click the "Generate new private key" button
   - Click "Generate key" in the confirmation dialog
   - A JSON file will be downloaded (e.g., `estate-bridge-project-firebase-adminsdk-xxxxx.json`)

3. **Extract the Credentials**
   
   Open the downloaded JSON file and find these three values:
   
   ```json
   {
     "project_id": "estate-bridge-project",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@estate-bridge-project.iam.gserviceaccount.com"
   }
   ```

4. **Update backend/.env File**
   
   Replace the placeholder values in `backend/.env`:
   
   ```env
   FIREBASE_PROJECT_ID=estate-bridge-project
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@estate-bridge-project.iam.gserviceaccount.com
   ```

   **IMPORTANT**: 
   - Keep the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - Keep all the `\n` characters (they represent line breaks)
   - Wrap the private key in double quotes
   - Copy the ENTIRE private key value from the JSON file

## After Updating .env

Once you've updated the `.env` file, run:

```bash
cd backend
npm run seed:regions
```

This will populate the regions collection with initial data.

## Security Reminder

⚠️ **NEVER commit the service account key to version control!**

The `.gitignore` file is already configured to exclude:
- `.env` files
- `*-firebase-adminsdk-*.json` files
- `serviceAccountKey.json` files

## Need Help?

See `SERVICE_ACCOUNT_SETUP.md` for detailed instructions and troubleshooting.
