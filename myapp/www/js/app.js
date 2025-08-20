// ✅ Ensure DOM is fully loaded before executing
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ App Loaded. Checking Firebase & Event Listeners...");

    // Firebase Authentication & Firestore References
    const auth = firebase.auth();
    const db = firebase.firestore();

    // ✅ Ensure Auth Persistence (Keeps Users Logged In)
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log("🔐 Auth persistence enabled: Users remain logged in.");
        })
        .catch((error) => {
            console.error("❌ Error enabling auth persistence:", error);
        });

    // ✅ Role Selection - Navigation to Buyer or Seller Register
    const buyerBtn = document.getElementById("buyerBtn");
    const sellerBtn = document.getElementById("sellerBtn");

    if (buyerBtn && sellerBtn) {
        buyerBtn.addEventListener("click", function () {
            window.location.href = "buyer_register.html";
        });
        sellerBtn.addEventListener("click", function () {
            window.location.href = "seller_register.html";
        });
    }

    // ✅ Buyer Registration
    const buyerRegisterForm = document.getElementById("buyerRegisterForm");
    if (buyerRegisterForm) {
        buyerRegisterForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const buyerName = document.getElementById("buyerName")?.value;
            const buyerEmail = document.getElementById("buyerEmail")?.value;
            const buyerMobile = document.getElementById("buyerMobile")?.value;
            const buyerPassword = document.getElementById("buyerPassword")?.value;
            const buyerAddress = document.getElementById("buyerAddress")?.value;
            const buyerCountry = document.getElementById("buyerCountry")?.value;
            const buyerState = document.getElementById("buyerState")?.value;
            const buyerPincode = document.getElementById("buyerPincode")?.value;

            if (!buyerEmail || !buyerPassword) {
                alert("❌ Please enter an email and password!");
                return;
            }

            auth.createUserWithEmailAndPassword(buyerEmail, buyerPassword)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log("✅ Buyer Registered:", user.uid);

                    return db.collection("buyers").doc(user.uid).set({
                        buy_id: user.uid,
                        buy_name: buyerName || "",
                        buy_email: buyerEmail,
                        buy_mobile: buyerMobile || "",
                        buy_address: buyerAddress || "",
                        buy_country: buyerCountry || "",
                        buy_state: buyerState || "",
                        buy_pincode: buyerPincode || "",
                        buy_createdate: new Date().toISOString()
                    });
                })
                .then(() => {
                    alert("🎉 Registration Successful! Redirecting...");
                    window.location.href = "select_region.html"; // ✅ Buyers select location
                })
                .catch((error) => {
                    console.error("❌ Registration Error:", error.message);
                    alert("Error: " + error.message);
                });
        });
    }

    // ✅ Seller Registration
    const sellerRegisterForm = document.getElementById("sellerRegisterForm");
    if (sellerRegisterForm) {
        sellerRegisterForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const sellerName = document.getElementById("sellerName")?.value;
            const sellerEmail = document.getElementById("sellerEmail")?.value;
            const sellerMobile = document.getElementById("sellerMobile")?.value;
            const sellerPassword = document.getElementById("sellerPassword")?.value;
            const sellerAddress = document.getElementById("sellerAddress")?.value;
            const sellerCountry = document.getElementById("sellerCountry")?.value;
            const sellerState = document.getElementById("sellerState")?.value;
            const sellerPincode = document.getElementById("sellerPincode")?.value;

            if (!sellerEmail || !sellerPassword) {
                alert("❌ Please enter an email and password!");
                return;
            }

            auth.createUserWithEmailAndPassword(sellerEmail, sellerPassword)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log("✅ Seller Registered:", user.uid);

                    return db.collection("sellers").doc(user.uid).set({
                        sell_id: user.uid,
                        sell_name: sellerName || "",
                        sell_email: sellerEmail,
                        sell_mobile: sellerMobile || "",
                        sell_address: sellerAddress || "",
                        sell_country: sellerCountry || "",
                        sell_state: sellerState || "",
                        sell_pincode: sellerPincode || "",
                        sell_createdate: new Date().toISOString()
                    });
                })
                .then(() => {
                    alert("🎉 Registration Successful! Redirecting...");
                    window.location.href = "dashboard.html"; // ✅ Sellers go directly to the dashboard
                })
                .catch((error) => {
                    console.error("❌ Registration Error:", error.message);
                    alert("Error: " + error.message);
                });
        });
    }

    // ✅ Buyer Login (Redirects to `select_region.html`)
    const buyerLoginForm = document.getElementById("buyerLoginForm");
    if (buyerLoginForm) {
        buyerLoginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const loginEmail = document.getElementById("email").value;
            const loginPassword = document.getElementById("password").value;

            auth.signInWithEmailAndPassword(loginEmail, loginPassword)
                .then((userCredential) => {
                    console.log("✅ Buyer Login Successful:", userCredential.user.uid);
                    alert("🎉 Login Successful! Redirecting...");
                    window.location.href = "select_region.html"; // ✅ Buyers need to pick a location
                })
                .catch((error) => {
                    console.error("❌ Buyer Login Error:", error.message);
                    alert("Error: " + error.message);
                });
        });
    }

    // ✅ Seller Login (Redirects to `dashboard.html`)
    const sellerLoginForm = document.getElementById("sellerLoginForm");
    if (sellerLoginForm) {
        sellerLoginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const loginEmail = document.getElementById("email").value;
            const loginPassword = document.getElementById("password").value;

            auth.signInWithEmailAndPassword(loginEmail, loginPassword)
                .then((userCredential) => {
                    console.log("✅ Seller Login Successful:", userCredential.user.uid);
                    alert("🎉 Login Successful! Redirecting...");
                    window.location.href = "dashboard.html"; // ✅ Sellers go directly to dashboard
                })
                .catch((error) => {
                    console.error("❌ Seller Login Error:", error.message);
                    alert("Error: " + error.message);
                });
        });
    }

    // ✅ Logout Functionality
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            auth.signOut()
                .then(() => {
                    alert("✅ Logged out successfully!");
                    window.location.href = "index.html";
                })
                .catch((error) => {
                    console.error("❌ Logout Error:", error.message);
                    alert("Error: " + error.message);
                });
        });
    }

    console.log("✅ App.js Initialization Complete!");
});
