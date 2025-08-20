document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Region Selection Loaded!");

    // ✅ Ensure Firebase SDK is Loaded
    if (typeof firebase === "undefined") {
        console.error("❌ Firebase SDK not found! Make sure it is included in select_region.html.");
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    const countrySelect = document.getElementById("country");
    const stateSelect = document.getElementById("state");
    const stateLabel = document.getElementById("stateLabel");
    const confirmButton = document.getElementById("confirmLocation");

    if (!confirmButton) {
        console.error("❌ Confirm button NOT found!");
        return;
    }

    console.log("✅ Confirm Location button found.");

    // ✅ State Data for Each Country
    const states = {
        "US": ["California", "Texas", "New York", "Florida", "Illinois"],
        "UK": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"],
        "India": ["Delhi", "Maharashtra", "Gujarat", "Tamilnadu", "Assam"],
        "Canada": ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba"],
        "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"]
    };

    // ✅ Populate State Dropdown When Country is Selected
    countrySelect.addEventListener("change", function () {
        let selectedCountry = countrySelect.value;
        stateSelect.innerHTML = '<option value="" disabled selected>Select a state</option>'; // Reset

        if (selectedCountry) {
            stateLabel.classList.remove("hidden");
            stateSelect.classList.remove("hidden");

            states[selectedCountry].forEach(state => {
                let option = document.createElement("option");
                option.value = state;
                option.textContent = state;
                stateSelect.appendChild(option);
            });
        } else {
            stateLabel.classList.add("hidden");
            stateSelect.classList.add("hidden");
        }
    });

    // ✅ Ensure Firebase User is Authenticated Before Saving Data
    auth.onAuthStateChanged((user) => {
        if (!user) {
            alert("⚠️ No user logged in. Redirecting to login...");
            window.location.href = "index.html"; // Redirect to login if not authenticated
            return;
        }

        console.log("✅ User logged in:", user.uid);

        confirmButton.addEventListener("click", function () {
            let selectedCountry = countrySelect.value;
            let selectedState = stateSelect.value;

            if (!selectedCountry || !selectedState) {
                alert("⚠️ Please select a country and state.");
                return;
            }

            // ✅ Save region to Firestore
            let userRef = db.collection("buyers").doc(user.uid);
            db.collection("sellers").doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    userRef = db.collection("sellers").doc(user.uid);
                }

                return userRef.set({
                    country: selectedCountry,
                    state: selectedState
                }, { merge: true });
            }).then(() => {
                // ✅ Save to `localStorage` for `buy_property.js`
                localStorage.setItem("selectedCountry", selectedCountry);
                localStorage.setItem("selectedState", selectedState);

                console.log(`📌 Location Saved: ${selectedState}, ${selectedCountry}`);
                alert("✅ Location saved successfully!");

                window.location.replace("dashboard.html");
            }).catch(error => {
                alert("❌ Error saving location: " + error.message);
                console.error(error);
            });
        });
    });
});
