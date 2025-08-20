document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Dashboard Loaded. Checking Firebase & Event Listeners...");

    // Firebase Authentication & Firestore References
    const auth = firebase.auth();
    const db = firebase.firestore();

    // DOM Elements
    const userNameElement = document.getElementById("userName");
    const propertyLink = document.getElementById("propertyLink");
    const appointmentsButton = document.getElementById("appointments");
    const aiSupportButton = document.getElementById("aiSupport");
    const dynamicButton = document.getElementById("dynamicButton"); // ✅ Change Location / Property List Button
    const logoutButton = document.getElementById("logout");
    const feedbackButton = document.getElementById("feedback"); // ✅ New Feedback Button

    // ✅ Show loading state
    if (userNameElement) {
        userNameElement.textContent = "Loading...";
    }

    // ✅ Check Auth State and Fetch User Data
    auth.onAuthStateChanged(async function (user) {
        if (!user) {
            console.warn("⚠️ No user found, redirecting to index.html...");
            window.location.href = "index.html";
            return;
        }

        console.log(`✅ User detected: ${user.uid}`);

        try {
            let userType = "";
            let userData = null;

            // 🔍 Check if the user is a Buyer
            const buyerDoc = await db.collection("buyers").doc(user.uid).get();
            if (buyerDoc.exists) {
                userType = "buyer";
                userData = buyerDoc.data();
                console.log("🎯 Buyer Data:", userData);

                if (userNameElement) {
                    userNameElement.textContent = `Welcome, ${userData.buy_name || "User"}`;
                }
                if (propertyLink) {
                    propertyLink.textContent = "Buy Property";
                    propertyLink.href = "buy_property.html";
                }

                // ✅ Set "Change Location" button for buyers
                if (dynamicButton) {
                    dynamicButton.textContent = "Change Location";
                    dynamicButton.addEventListener("click", function () {
                        window.location.href = "select_region.html";
                    });
                }
            }

            // 🔍 Check if the user is a Seller
            const sellerDoc = await db.collection("sellers").doc(user.uid).get();
            if (sellerDoc.exists) {
                userType = "seller";
                userData = sellerDoc.data();
                console.log("🎯 Seller Data:", userData);

                if (userNameElement) {
                    userNameElement.textContent = `Welcome, ${userData.sell_name || "User"}`;
                }
                if (propertyLink) {
                    propertyLink.textContent = "Sell Property";
                    propertyLink.href = "sell_property.html";
                }

                // ✅ Set "Property List" button for sellers
                if (dynamicButton) {
                    dynamicButton.textContent = "Property List";
                    dynamicButton.addEventListener("click", function () {
                        window.location.href = "seller_list.html";
                    });
                }
            }

            if (!userType) {
                console.error("⚠️ No user data found in Firestore.");
                if (userNameElement) {
                    userNameElement.textContent = "User not found";
                }
                return;
            }

            // ✅ Handle "Current Appointments" Button Based on User Type
            if (appointmentsButton) {
                appointmentsButton.addEventListener("click", function () {
                    const redirectPage = userType === "buyer" 
                        ? "appointments_buyer.html" 
                        : "appointments_seller.html";
                    window.location.href = redirectPage;
                });
            }

            // ✅ Handle "Talk with AI Support" Button
            if (aiSupportButton) {
                aiSupportButton.addEventListener("click", function () {
                    window.location.href = "ai_support.html"; // ✅ Redirect to AI support page
                });
            }

        } catch (error) {
            console.error("❌ Error fetching user data:", error.message);
            if (userNameElement) {
                userNameElement.textContent = "Error loading user data";
            }
        }
    });

    // ✅ Feedback Button (Replaces Settings)
    if (feedbackButton) {
        feedbackButton.addEventListener("click", function () {
            window.location.href = "feedback.html";
        });
    }

    // ✅ Logout Button - Properly logs out and redirects to index.html
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            auth.signOut().then(function () {
                console.log("✅ Logged out successfully!");
                window.location.href = "index.html";
            }).catch(function (error) {
                console.error("❌ Logout Error:", error.message);
                alert("Error: " + error.message);
            });
        });
    }

    console.log("✅ Dashboard.js Initialization Complete!");
});
