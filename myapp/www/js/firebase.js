// ✅ Firebase Configuration (Keep this secure)
var firebaseConfig = {
    apiKey: "", // the api key was removed for security
    authDomain: "estate-bridge-project.firebaseapp.com",
    projectId: "estate-bridge-project",
    storageBucket: "estate-bridge-project.firebasestorage.app",  // ✅ FIXED: Correct bucket name
    messagingSenderId: "735185113867",
    appId: "1:735185113867:web:4fae0f214b961aa499080e",
    measurementId: "G-TTQZSPJE46"
};

// ✅ Initialize Firebase (Prevents reinitialization issues)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ✅ Initialize Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();
let storage;

// ✅ Enable Auth Persistence (Keeps users logged in after closing the app)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log("🔐 Auth persistence enabled: Users stay logged in even after closing the app.");
    })
    .catch((error) => {
        console.error("❌ Error enabling auth persistence:", error);
    });

// ✅ Ensure Firebase Storage is Available
try {
    storage = firebase.storage();
    console.log("✅ Firebase Storage Initialized: Success");
} catch (error) {
    console.error("🚨 Firebase Storage Initialization Failed!", error);
}

// ✅ Enable Firestore Offline Persistence (Optional, Improves Performance)
db.enablePersistence()
    .catch((err) => {
        console.warn("⚠️ Firestore Persistence Error:", err);
    });

// ✅ Debugging Firebase Initialization
console.log("✅ Firebase Initialized:", firebase.apps.length > 0);

// ✅ Check if User is Logged In & Redirect to Dashboard
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log(`✅ User is still logged in: ${user.uid}`);

        // 🔄 Redirect to dashboard if user opens the login page
        if (window.location.pathname.includes("index.html")) {
            window.location.href = "dashboard.html";
        }
    } else {
        console.warn("⚠️ No user session found.");
    }
});

/**
 * ✅ Uploads a property image to Firebase Storage.
 * - Automatically organizes images into folders based on propertyId.
 * - Limits file size to **5MB** (change MAX_FILE_SIZE if needed).
 * - Returns the **download URL** after a successful upload.
 * 
 * @param {File} file - The image file to upload.
 * @param {string} propertyId - The unique property ID.
 * @returns {Promise<string | null>} - Download URL or null if failed.
 */
async function uploadPropertyImage(file, propertyId) {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // ✅ Limit to 5MB

    if (!file) {
        console.error("🚨 No file selected for upload!");
        return null;
    }

    if (!storage) {
        console.error("🚨 Firebase Storage is not initialized!");
        return null;
    }

    if (file.size > MAX_FILE_SIZE) {
        console.error(`🚨 File too large! Max allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
        return null;
    }

    try {
        const timestamp = Date.now(); // ✅ Unique identifier for file
        const filePath = `property_images/${propertyId}/${timestamp}_${file.name}`;
        const storageRef = storage.ref(filePath);

        console.log(`🚀 Uploading file: ${file.name} to ${filePath}`);

        // ✅ Upload file
        const snapshot = await storageRef.put(file);

        // ✅ Get and return the download URL
        const downloadURL = await snapshot.ref.getDownloadURL();
        console.log("✅ File uploaded successfully! URL:", downloadURL);

        return downloadURL;
    } catch (error) {
        console.error("🚨 Upload Error:", error.code, error.message);
        return null;
    }
}
