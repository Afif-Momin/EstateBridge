document.addEventListener("DOMContentLoaded", function () {
    const auth = firebase.auth();
    const db = firebase.firestore();
    let storage;

    try {
        storage = firebase.storage();
        console.log("✅ Firebase Storage Initialized.");
    } catch (error) {
        console.error("🚨 Firebase Storage Initialization Failed!", error);
        alert("❌ Error initializing Firebase Storage. Please refresh and try again.");
        return;
    }

    const propertyForm = document.getElementById("propertyForm");
    const countryDropdown = document.getElementById("country");
    const stateDropdown = document.getElementById("state");
    const imagePreviewContainer = document.getElementById("imagePreview");
    const statusMessage = document.getElementById("statusMessage");

    const statesByCountry = {
        "US": ["California", "Texas", "New York", "Florida", "Illinois"],
        "UK": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"],
        "India": ["Delhi", "Maharashtra", "Gujarat", "Tamilnadu", "Assam"],
        "Canada": ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba"],
        "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"]
    };

    // ✅ Populate State Dropdown
    countryDropdown.addEventListener("change", function () {
        const selectedCountry = countryDropdown.value;
        stateDropdown.innerHTML = '<option value="">Select State</option>';

        if (statesByCountry[selectedCountry]) {
            statesByCountry[selectedCountry].forEach(state => {
                const option = document.createElement("option");
                option.value = state;
                option.textContent = state;
                stateDropdown.appendChild(option);
            });
        }
    });

    countryDropdown.dispatchEvent(new Event("change"));

    // ✅ Display Image Previews
    document.getElementById("propertyImages").addEventListener("change", function (event) {
        imagePreviewContainer.innerHTML = "";
        const files = event.target.files;
        const validExtensions = ["image/jpeg", "image/png", "image/jpg"];

        for (const file of files) {
            if (!validExtensions.includes(file.type)) {
                alert(`❌ Invalid file type: ${file.name}. Only JPG and PNG are allowed.`);
                continue;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const imgElement = document.createElement("img");
                imgElement.src = e.target.result;
                imgElement.classList.add("preview-image");
                imagePreviewContainer.appendChild(imgElement);
            };
            reader.readAsDataURL(file);
        }
    });

    // ✅ Ensure Firebase Auth is Ready Before Checking User
    auth.onAuthStateChanged((user) => {
        if (!user) {
            alert("You must be logged in as a seller to post a property.");
            window.location.href = "seller_login.html"; // Redirect to login page
            return;
        }

        console.log("✅ User authenticated:", user.uid);

        // ✅ Property Form Submission
        propertyForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            statusMessage.textContent = "Uploading property... Please wait.";
            statusMessage.style.color = "blue";

            const propertyType = document.getElementById("propertyType").value;
            const price = document.getElementById("price").value;
            const description = document.getElementById("description").value;
            const country = countryDropdown.value;
            const state = stateDropdown.value;
            const imageFiles = document.getElementById("propertyImages").files;

            if (!propertyType || !price || !description || !country || !state || imageFiles.length === 0) {
                alert("❌ All fields are required!");
                return;
            }

            try {
                const sellerDoc = await db.collection("sellers").doc(user.uid).get();
                if (!sellerDoc.exists) {
                    alert("❌ Seller profile not found!");
                    return;
                }

                const sellerData = sellerDoc.data();
                const sellerEmail = sellerData.sell_email || "Unknown"; // ✅ Fetch seller's email

                const propertyRef = db.collection("properties").doc();
                const propertyId = propertyRef.id;
                const imageURLs = [];

                console.log(`🚀 Uploading ${imageFiles.length} images...`);

                // ✅ Parallel Image Uploads Using `Promise.all()`
                const uploadTasks = Array.from(imageFiles).map(async (imageFile, index) => {
                    try {
                        const fileName = `${propertyId}_${Date.now()}_${index}.jpg`;
                        const storageRef = storage.ref(`property_images/${fileName}`);
                        console.log(`📤 Uploading: ${fileName}`);

                        // Show progress
                        statusMessage.textContent = `Uploading image ${index + 1} of ${imageFiles.length}...`;

                        // Upload Image
                        const snapshot = await storageRef.put(imageFile);
                        const imageURL = await snapshot.ref.getDownloadURL();
                        console.log(`✅ Image ${index + 1} uploaded: ${imageURL}`);
                        return imageURL;
                    } catch (error) {
                        console.error(`🚨 Error uploading image ${index + 1}:`, error.message);
                        return null;
                    }
                });

                const results = await Promise.all(uploadTasks);
                results.forEach(url => {
                    if (url) imageURLs.push(url);
                });

                if (imageURLs.length === 0) {
                    alert("❌ Failed to upload images. Please try again.");
                    return;
                }

                // ✅ Store Property Data in Firestore
                await propertyRef.set({
                    property_id: propertyId,
                    sell_id: user.uid,
                    sell_name: sellerData.sell_name,
                    sell_email: sellerEmail, // ✅ Now storing seller email
                    pro_type: propertyType,
                    pro_price: price,
                    description: description,
                    country: country,
                    state: state,
                    image_urls: imageURLs,
                    pro_status: "For Sale",
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert("🎉 Property posted successfully!");
                window.location.href = "dashboard.html";
            } catch (error) {
                console.error("🔥 Error posting property:", error);
                alert(`❌ Error posting property: ${error.message}`);
                statusMessage.textContent = "Error posting property. Try again.";
                statusMessage.style.color = "red";
            }
        });
    });
});
