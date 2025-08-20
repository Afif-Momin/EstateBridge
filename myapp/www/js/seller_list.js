document.addEventListener("DOMContentLoaded", function () {
    const auth = firebase.auth();
    const db = firebase.firestore();
    const propertyList = document.getElementById("propertyList");

    auth.onAuthStateChanged(async function (user) {
        if (!user) {
            alert("⚠️ You must be logged in to view your listed properties.");
            window.location.href = "index.html";
            return;
        }

        console.log(`📜 Fetching properties listed by Seller ID: ${user.uid}`);
        propertyList.innerHTML = "<p>Loading properties...</p>";

        try {
            const querySnapshot = await db.collection("properties")
                .where("sell_id", "==", user.uid)
                .get();

            propertyList.innerHTML = "";

            if (querySnapshot.empty) {
                propertyList.innerHTML = "<p>No properties listed yet.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const property = doc.data();
                console.log("🏡 Property Data:", property);

                const propertyHTML = `
                    <div class="property-card">
                        <img src="${property.image_urls ? property.image_urls[0] : 'default.jpg'}" alt="Property Image">
                        <h3>${property.pro_type}</h3>
                        <p><strong>💰 Price:</strong> ${property.pro_price}</p>
                        <p><strong>📍 Location:</strong> ${property.state}, ${property.country}</p>
                        <p><strong>🔖 Status:</strong> ${property.pro_status}</p>
                    </div>
                `;

                propertyList.innerHTML += propertyHTML;
            });

        } catch (error) {
            console.error("❌ Error fetching properties:", error);
            propertyList.innerHTML = "<p class='error-message'>Error loading properties. Please try again.</p>";
        }
    });
});
