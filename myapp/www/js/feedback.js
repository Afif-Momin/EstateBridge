document.addEventListener("DOMContentLoaded", function () {
    const feedbackList = document.getElementById("feedbackList");

    console.log("📢 Fetching feedback from local storage...");

    // ✅ Show a loading message
    feedbackList.innerHTML = "<p>Loading feedback...</p>";

    try {
        // ✅ Retrieve feedback from localStorage
        const feedbackData = JSON.parse(localStorage.getItem("feedback")) || [];

        feedbackList.innerHTML = "";

        if (feedbackData.length === 0) {
            feedbackList.innerHTML = "<p>No feedback found.</p>";
            return;
        }

        // ✅ Sort feedback (newest first)
        feedbackData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        feedbackData.forEach((feedback) => {
            // ✅ Convert rating to star icons
            const stars = "⭐".repeat(feedback.rating);

            // ✅ Format the timestamp
            const feedbackDate = feedback.timestamp
                ? new Date(feedback.timestamp).toLocaleString()
                : "No Date Set";

            const feedbackHTML = `
                <div class="feedback-card">
                    <h3>${feedback.role === "buyer" ? "🏠 Seller Feedback" : "🛒 Buyer Feedback"}</h3>
                    <p><strong>⭐ Rating:</strong> ${stars}</p>
                    <p><strong>💬 Feedback:</strong> ${feedback.feedbackText || "No feedback provided."}</p>
                    <p><strong>📅 Date:</strong> ${feedbackDate}</p>
                </div>
            `;

            feedbackList.innerHTML += feedbackHTML;
        });

    } catch (error) {
        console.error("❌ Error fetching feedback:", error);
        feedbackList.innerHTML = "<p class='error-message'>Error loading feedback. Please try again.</p>";
    }
});
