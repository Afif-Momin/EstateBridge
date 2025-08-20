document.addEventListener("DOMContentLoaded", function () {
    const chatBox = document.getElementById("chatBox");
    const userInput = document.getElementById("userInput");
    const sendButton = document.getElementById("sendButton");

    if (!chatBox || !userInput || !sendButton) {
        console.error("❌ One or more required elements are missing! Check your HTML.");
        return;
    }

    sendButton.addEventListener("click", sendMessage);

    // ✅ Enable "Enter" key to send a message
    userInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent accidental form submission
            sendMessage();
        }
    });
});

// ✅ Send user message to Dialogflow
function sendMessage() {
    const userInput = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");
    const userText = userInput.value.trim();

    if (userText === "") return; // Don't send empty messages

    addMessage(userText, "user-message");
    addMessage("⏳ AI is thinking...", "bot-message typing-effect");

    const sessionId = "session-" + Math.random().toString(36).substring(7); // ✅ Generate session ID

    fetch("https://dialogflow.googleapis.com/v2/projects/estate-bridge-project/agent/sessions/" + sessionId + ":detectIntent", {
        method: "POST",
        headers: {
            "Authorization": "Bearer YOUR_DIALOGFLOW_ACCESS_TOKEN", // ✅ Replace with your token
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            queryInput: {
                text: {
                    text: userText,
                    languageCode: "en"
                }
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        removeLoadingMessage();
        if (data.queryResult && data.queryResult.fulfillmentText) {
            addMessage(data.queryResult.fulfillmentText, "bot-message");
        } else {
            addMessage("🤖 AI couldn't understand. Try again!", "bot-message");
        }
    })
    .catch(error => {
        console.error("❌ Error:", error);
        removeLoadingMessage();
        addMessage("❌ Error connecting to AI Support. Please check your internet.", "bot-message");
    });

    userInput.value = ""; // ✅ Clear input
}

// ✅ Function to add messages to the chatbox
function addMessage(text, className) {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;

    const messageDiv = document.createElement("div");
    messageDiv.classList.add(className);
    messageDiv.innerText = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Remove "AI is typing..." message
function removeLoadingMessage() {
    document.querySelectorAll(".bot-message.typing-effect").forEach(msg => msg.remove());
}

// ✅ Go back to dashboard
function goBack() {
    window.location.href = "dashboard.html";
}
