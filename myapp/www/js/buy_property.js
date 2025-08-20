document.addEventListener("DOMContentLoaded", function () {
    const auth = firebase.auth();
    const db = firebase.firestore();
    const propertyList = document.getElementById("propertyList");

    console.log("🔎 Checking selected region...");
    const selectedCountry = localStorage.getItem("selectedCountry");
    const selectedState = localStorage.getItem("selectedState");

    console.log("📌 LocalStorage Country:", selectedCountry);
    console.log("📌 LocalStorage State:", selectedState);

    if (!selectedCountry || !selectedState) {
        window.location.href = "select_region.html";
        return;
    }

    console.log(`🏡 Fetching properties for: ${selectedCountry}, ${selectedState}`);

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = "index.html";
            return;
        }

        try {
            const propertiesSnapshot = await db.collection("properties")
                .where("country", "==", selectedCountry)
                .where("state", "==", selectedState)
                .get();

            propertyList.innerHTML = "";

            if (propertiesSnapshot.empty) {
                propertyList.innerHTML = "<p class='no-properties'>No properties available in this region.</p>";
                return;
            }

            for (const doc of propertiesSnapshot.docs) {
                const property = doc.data();
                const propertyId = doc.id;
                console.log("🏡 Property Data:", property);

                let propertyStatus = property.pro_status || "For Sale";
                let sellerEmail = property.sell_email || "Unknown";
                let sellerName = property.sell_name || "Unknown Seller";

                // ✅ Fetch latest appointment status directly from Firestore
                try {
                    const appointmentSnapshot = await db.collection("appointments")
                        .where("property_id", "==", propertyId)
                        .where("status", "in", ["Ongoing", "Sold"])
                        .get();

                    if (!appointmentSnapshot.empty) {
                        propertyStatus = "Ongoing";
                    }
                } catch (error) {
                    console.error("❌ Error fetching property status:", error);
                }

                // ✅ Fetch Seller Email if missing
                if (!sellerEmail || sellerEmail === "Unknown") {
                    try {
                        const sellerDoc = await db.collection("sellers").doc(property.sell_id).get();
                        if (sellerDoc.exists) {
                            sellerEmail = sellerDoc.data().sell_email || "Unknown";
                        }
                    } catch (error) {
                        console.error("❌ Error fetching seller email:", error);
                    }
                }

                console.log(`📧 Seller Email: ${sellerEmail}`);

                const disableButton = propertyStatus !== "For Sale" ? "disabled" : "";

                const propertyHTML = `
                <div class="property-card">
                    <img src="${property.image_urls && property.image_urls.length > 0 ? property.image_urls[0] : 'default-image.jpg'}" 
                         alt="${property.pro_type}" class="property-image">
                    <h3>${property.pro_type}</h3>
                    <p><strong>Price:</strong> ${property.pro_price}</p>
                    <p><strong>Description:</strong> ${property.description}</p>
                    <p><strong>Seller:</strong> ${sellerName}</p>
                    <p><strong>Status:</strong> <span id="status-${propertyId}">${propertyStatus}</span></p>
                    <button class="fix-appointment-btn" ${disableButton}
                        data-property-id="${propertyId}"
                        data-pro-type="${property.pro_type}"
                        data-pro-price="${property.pro_price}"
                        data-seller-id="${property.sell_id}"
                        data-seller-name="${sellerName}"
                        data-seller-email="${sellerEmail}"
                        data-buyer-id="${user.uid}">
                        Fix Deal
                    </button>
                </div>
            `;
                propertyList.innerHTML += propertyHTML;
            }
        } catch (error) {
            console.error("❌ Error fetching properties:", error);
            propertyList.innerHTML = "<p class='error-message'>Error loading properties. Please try again.</p>";
        }
    });
});

// ✅ Fix Appointment & Update Firestore
document.addEventListener("click", async function (event) {
    if (event.target.classList.contains("fix-appointment-btn")) {
        console.log("📩 Fix Appointment Button Clicked!");

        const button = event.target;
        button.disabled = true;

        const propertyId = button.getAttribute("data-property-id");
        const propertyType = button.getAttribute("data-pro-type");
        const propertyPrice = button.getAttribute("data-pro-price");
        const sellerId = button.getAttribute("data-seller-id");
        const sellerName = button.getAttribute("data-seller-name");
        let sellerEmail = button.getAttribute("data-seller-email");
        const buyerId = button.getAttribute("data-buyer-id");

        if (!propertyId || !sellerId || !buyerId) return;

        try {
            const buyerDoc = await db.collection("buyers").doc(buyerId).get();
            if (!buyerDoc.exists) return;

            const buyerData = buyerDoc.data();
            const buyerName = buyerData.buy_name || "Unknown Buyer";

            console.log(`🔄 Checking if appointment already exists for Property ID: ${propertyId}`);

            const existingAppointment = await db.collection("appointments")
                .where("property_id", "==", propertyId)
                .where("status", "in", ["Ongoing", "Sold"])
                .get();

            if (!existingAppointment.empty) return;

            console.log(`📧 Fetching seller email for Seller ID: ${sellerId}`);

            // ✅ Fetch seller email from `sellers` collection
            const sellerDoc = await db.collection("sellers").doc(sellerId).get();
            if (sellerDoc.exists) {
                sellerEmail = sellerDoc.data().sell_email || "Unknown";
            }

            console.log(`✅ Seller Email Fetched: ${sellerEmail}`);

            console.log(`🔄 Creating Appointment for Property ID: ${propertyId}`);

            const appointmentRef = db.collection("appointments").doc();
            const appointmentId = appointmentRef.id;

            // ✅ Save Appointment in Firestore
            await appointmentRef.set({
                appointment_id: appointmentId,
                property_id: propertyId,
                property_type: propertyType,
                property_price: propertyPrice,
                seller_id: sellerId,
                seller_name: sellerName,
                seller_email: sellerEmail,
                buyer_id: buyerId,
                buyer_name: buyerName,
                status: "Ongoing",
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Appointment Created! ID: ${appointmentId} | Status: Ongoing`);
            document.getElementById(`status-${propertyId}`).textContent = "Ongoing";

            // ✅ Update Property Status in Firestore
            await db.collection("properties").doc(propertyId).update({
                pro_status: "Ongoing"
            });

            console.log(`✅ Property Status Updated to "Ongoing"`);

            // ✅ Redirect to appointments page
            window.location.href = "appointments.html";
        } catch (error) {
            console.error("❌ Error creating appointment:", error);
        }
    }
});
