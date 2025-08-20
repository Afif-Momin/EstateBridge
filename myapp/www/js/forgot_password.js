document.addEventListener("DOMContentLoaded", function () {
    console.log("🔑 Forgot Password Loaded!");

    if (typeof firebase === "undefined") {
        console.error("❌ Firebase SDK not loaded.");
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    const emailForm = document.getElementById("emailForm");

    emailForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const userEmail = document.getElementById("email").value.trim();

        if (!userEmail) {
            alert("⚠️ Please enter a valid email.");
            return;
        }

        try {
            // ✅ Check if Email Exists in Firebase Auth
            const signInMethods = await auth.fetchSignInMethodsForEmail(userEmail);
            console.log("🔍 Sign-in methods found:", signInMethods);

            if (signInMethods.length > 0) {
                // ✅ Email exists, send reset link
                await auth.sendPasswordResetEmail(userEmail);
                alert("✅ Password reset email sent! Check your inbox.");
                window.location.href = "buyer_login.html"; // Redirect to login
                return;
            }

            console.warn("⚠️ Email not found in Firebase Auth. Checking Firestore...");

            // ✅ Ensure Firestore Query Works with Authentication
            const userSnapshot = await db.collectionGroup("users").where("email", "==", userEmail).get();

            if (!userSnapshot.empty) {
                alert("⚠️ Email found in Firestore, but not in Auth. Contact support.");
            } else {
                alert("❌ No account found with this email.");
            }
        } catch (error) {
            console.error("❌ Error:", error);
            alert("❌ Error: " + error.message);
        }
    });
});
