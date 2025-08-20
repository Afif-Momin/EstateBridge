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

        console.log(`📅 Fetching appointments for Seller ID: ${user.uid}`);

        appointmentsList.innerHTML = "<p>Loading appointments...</p>";

        try {
            const sellerAppointmentsSnapshot = await db.collection("appointments")
                .where("seller_id", "==", user.uid)
                .where("status", "==", "Pending") // ✅ Only show Pending requests
                .get();

            appointmentsList.innerHTML = "";

            if (sellerAppointmentsSnapshot.empty) {
                appointmentsList.innerHTML = "<p>No buyer payment requests found.</p>";
                return;
            }

            sellerAppointmentsSnapshot.forEach((doc) => {
                const appointment = doc.data();
                const appointmentId = doc.id;

                const propertyType = appointment.property_type || "Unknown Property";
                const propertyPrice = appointment.property_price || "N/A";
                const buyerName = appointment.buyer_name || "Buyer Not Set";
                const buyerId = appointment.buyer_id || "Unknown";

                const appointmentDate = appointment.created_at && appointment.created_at.toDate
                    ? new Date(appointment.created_at.toDate()).toLocaleString()
                    : "No Date Set";

                const propertyStatus = appointment.status || "Pending";

                let actionButton = `<button class="accept-payment-btn" data-appointment-id="${appointmentId}" 
                    data-buyer-id="${buyerId}" data-buyer-name="${buyerName}" data-property-type="${propertyType}" data-property-price="${propertyPrice}">
                    Accept request
                </button>`;

                const appointmentHTML = `
                    <div class="appointment-card">
                        <h3>📌 Buyer Request</h3>
                        <p><strong>👤 Buyer:</strong> ${buyerName}</p>
                        <p><strong>🏡 Property:</strong> ${propertyType}</p>
                        <p><strong>💰 Price:</strong> ${propertyPrice}</p>
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

// ✅ Handle "Accept Payment" button click
document.addEventListener("click", async function (event) {
    if (event.target.classList.contains("accept-payment-btn")) {
        console.log("✅ Accept Payment Button Clicked!");

        const button = event.target;
        const appointmentId = button.getAttribute("data-appointment-id");
        const buyerId = button.getAttribute("data-buyer-id");
        const buyerName = button.getAttribute("data-buyer-name");
        const propertyType = button.getAttribute("data-property-type");
        const propertyPrice = button.getAttribute("data-property-price");

        if (!appointmentId || !buyerId) {
            alert("❌ Invalid appointment details.");
            return;
        }

        try {
            // ✅ Mark appointment as Sold
            await db.collection("appointments").doc(appointmentId).update({
                status: "Sold"
            });

            console.log(`✅ Payment accepted for appointment ID: ${appointmentId}`);
            alert("✅ Payment accepted! Property is now marked as Sold.");

            // ✅ Show Feedback Modal for Seller
            setTimeout(() => showFeedbackModal(appointmentId, buyerName, "seller"), 1000);

        } catch (error) {
            console.error("❌ Error accepting payment:", error);
            alert("❌ Failed to accept payment. Try again.");
        }
    }
});

// ✅ Show Feedback Modal (Stores Locally)
function showFeedbackModal(appointmentId, userName, role) {
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

        // ✅ Prevent duplicate feedback submission
        const existingFeedback = feedbackData.find(f => f.appointmentId === appointmentId);
        if (existingFeedback) {
            alert("❌ You have already submitted feedback for this transaction.");
            document.getElementById("feedbackModal").remove();
            return;
        }

        feedbackData.push({
            appointmentId,
            rating,
            feedbackText,
            userName,
            role,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem("feedback", JSON.stringify(feedbackData));

        alert("✅ Feedback submitted!");
        document.getElementById("feedbackModal").remove();
    });

    document.getElementById("skipFeedback").addEventListener("click", () => {
        document.getElementById("feedbackModal").remove();
    });
}
