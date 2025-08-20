document.addEventListener("DOMContentLoaded", function () {
    const auth = firebase.auth();
    const db = firebase.firestore();
    const appointmentsList = document.getElementById("appointmentsList");

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            alert("⚠️ You must be logged in to view your appointments.");
            window.location.href = "index.html";
            return;
        }

        console.log(`📅 Fetching appointments for user ID: ${user.uid}`);

        appointmentsList.innerHTML = "<p>Loading appointments...</p>";

        try {
            const buyerDoc = await db.collection("buyers").doc(user.uid).get();
            const sellerDoc = await db.collection("sellers").doc(user.uid).get();

            let userType = "";
            if (buyerDoc.exists) {
                userType = "buyer";
                console.log("👤 User is a Buyer");
            } else if (sellerDoc.exists) {
                userType = "seller";
                console.log("🏠 User is a Seller");
            } else {
                console.error("⚠️ User not found in buyers or sellers collection!");
                appointmentsList.innerHTML = "<p>Error loading appointments.</p>";
                return;
            }

            let querySnapshot;
            if (userType === "buyer") {
                querySnapshot = await db.collection("appointments")
                    .where("buyer_id", "==", user.uid)
                    .get();
            } else {
                querySnapshot = await db.collection("appointments")
                    .where("seller_id", "==", user.uid)
                    .get();
            }

            appointmentsList.innerHTML = "";

            if (querySnapshot.empty) {
                appointmentsList.innerHTML = "<p>No appointments found.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const appointment = doc.data();
                const appointmentId = doc.id;

                const propertyType = appointment.property_type || "Unknown Property";
                const propertyPrice = appointment.property_price || "N/A";
                const buyerName = appointment.buyer_name || "Buyer Not Set";
                const sellerName = appointment.seller_name || "Seller Not Set";
                const propertyStatus = appointment.status || "Pending";

                const appointmentDate = appointment.created_at && appointment.created_at.toDate
                    ? new Date(appointment.created_at.toDate()).toLocaleString()
                    : "No Date Set";

                let actionButton = "";

                if (userType === "buyer") {
                    if (propertyStatus === "Ongoing") {
                        actionButton = `<button class="make-payment-btn" data-appointment-id="${appointmentId}" data-seller-name="${sellerName}" data-seller-id="${appointment.seller_id}">Make Request</button>`;
                    } else if (propertyStatus === "Pending") {
                        actionButton = `<p class="waiting-text">⌛ Waiting for Seller to Accept</p>`;
                    } else if (propertyStatus === "Sold") {
                        actionButton = `<p class="paid-text">✅ Payment Completed</p>`;
                    }
                } else if (userType === "seller") {
                    if (propertyStatus === "Pending") {
                        actionButton = `<button class="accept-payment-btn" data-appointment-id="${appointmentId}" data-buyer-name="${buyerName}" data-buyer-id="${appointment.buyer_id}">Accept Request</button>`;
                    } else if (propertyStatus === "Sold") {
                        actionButton = `<p class="sold-text">🏡 Property Sold</p>`;
                    }
                }

                const appointmentHTML = `
                    <div class="appointment-card">
                        <h3>🏡 Property: ${propertyType}</h3>
                        <p><strong>💰 Price:</strong> ${propertyPrice}</p>
                        <p><strong>👤 Buyer:</strong> ${buyerName}</p>
                        <p><strong>🏠 Seller:</strong> ${sellerName}</p>
                        <p><strong>📅 Date:</strong> ${appointmentDate}</p>
                        <p><strong>🔖 Status:</strong> ${propertyStatus}</p>
                        ${actionButton}
                    </div>
                `;

                appointmentsList.innerHTML += appointmentHTML;
            });

        } catch (error) {
            console.error("❌ Error fetching appointments:", error);
            appointmentsList.innerHTML = "<p class='error-message'>Error loading appointments. Please try again.</p>";
        }
    });
});

// ✅ Handle "Make Payment" (Buyer Marks as Pending)
document.addEventListener("click", async function (event) {
    if (event.target.classList.contains("make-payment-btn")) {
        console.log("💳 Make Payment Button Clicked!");

        const appointmentId = event.target.getAttribute("data-appointment-id");
        const sellerId = event.target.getAttribute("data-seller-id");
        const sellerName = event.target.getAttribute("data-seller-name");

        if (!appointmentId || !sellerId) {
            alert("❌ Invalid appointment ID.");
            return;
        }

        try {
            await db.collection("appointments").doc(appointmentId).update({
                status: "Pending"
            });

            console.log(`✅ Payment request sent for appointment ID: ${appointmentId}`);
            alert("✅ Payment request sent! Waiting for seller approval.");

            setTimeout(() => showFeedbackModal(appointmentId, sellerName, "buyer"), 1000);

            location.reload();

        } catch (error) {
            console.error("❌ Error sending payment request:", error);
            alert("❌ Failed to send payment request. Try again.");
        }
    }
});

// ✅ Show Feedback Modal (Store Locally)
function showFeedbackModal(appointmentId, userName, role) {
    const userRole = role === "buyer" ? "Seller" : "Buyer";
    
    const modalHTML = `
        <div id="feedbackModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>📝 Leave Feedback for ${userName}</h2>
                <p>Rate your experience:</p>
                
                <div class="rating-container">
                    <select id="rating">
                        <option value="5">⭐️⭐️⭐️⭐️⭐️ - Excellent</option>
                        <option value="4">⭐️⭐️⭐️⭐️ - Good</option>
                        <option value="3">⭐️⭐️⭐️ - Average</option>
                        <option value="2">⭐️⭐️ - Poor</option>
                        <option value="1">⭐️ - Terrible</option>
                    </select>
                </div>

                <textarea id="feedbackText" placeholder="Write your feedback..."></textarea>

                <div class="button-container">
                    <button id="submitFeedback">Submit</button>
                    <button id="skipFeedback">Skip</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    document.getElementById("feedbackModal").style.display = "block";

    document.querySelector(".close").addEventListener("click", () => {
        document.getElementById("feedbackModal").remove();
    });

    document.getElementById("submitFeedback").addEventListener("click", () => {
        const rating = document.getElementById("rating").value;
        const feedbackText = document.getElementById("feedbackText").value;

        // ✅ Store feedback locally in localStorage
        const feedbackData = JSON.parse(localStorage.getItem("feedback")) || [];
        feedbackData.push({ appointmentId, rating, feedbackText, userName, role, timestamp: new Date().toISOString() });
        localStorage.setItem("feedback", JSON.stringify(feedbackData));

        alert("✅ Feedback submitted!");
        document.getElementById("feedbackModal").remove();
    });

    document.getElementById("skipFeedback").addEventListener("click", () => {
        document.getElementById("feedbackModal").remove();
    });
}
