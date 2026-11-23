//Connect Login page to backend API of Team member 2 Assighment

// login.js

// Defines the destination URL for the Back-End VM API endpoint that handles login requests
const BACKEND_URL = "http://<BACKEND_VM_IP>:3000/api/auth/login";

// Finds and stores a reference to the HTML form so JavaScript can listen for when the user clicks login
const loginForm = document.getElementById("loginForm");

// Finds and stores a reference to the message <div> tag in your HTML to display status text (errors or success)
const messageDiv = document.getElementById("message");

// Listens for the user to submit the form (clicking the login button or pressing Enter)
loginForm.addEventListener("submit", async function(event) {
    
    // STEP 1: Stops the browser from doing a default page refresh/reload on form submission
    event.preventDefault();

    // STEP 2: Grabs whatever text the user typed into the username and password input boxes
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // Changes the message box text to "Logging in..." with neutral gray text while waiting for the server
    messageDiv.textContent = "Logging in...";
    messageDiv.style.color = "#555"; 

    try {
        // STEP 3: Uses fetch() to send a POST request containing the username and password 
        // as a JSON string over the network to Team Member 2's backend API[cite: 1]
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json" // Tells the server we are sending JSON data
            },
            body: JSON.stringify({ username, password }) // Packs the data into a JSON structure
        });

        // Waits for the server to reply and parses the returned response data back into a JavaScript object
        const data = await response.json();

        // Checks if the HTTP response code is successful (200-299) AND the server JSON says success: true
        if (response.ok && data.success) {
            
            // STEP 4 (SUCCESS): Updates the UI message box to green text letting the user know it worked[cite: 1]
            messageDiv.textContent = "Login successful! Redirecting...";
            messageDiv.style.color = "#5cb85c"; // Green color
            
            // If the server sent back a secure authentication token, save it safely in the browser's local storage
            if (data.token) {
                localStorage.setItem("authToken", data.token);
            }

            // Optional code block to automatically redirect the user to a dashboard page after 1.5 seconds
            // setTimeout(() => { 
            //     window.location.href = "dashboard.html"; 
            // }, 1500);

        } else {
            // STEP 5 (SERVER ERROR/BAD CREDENTIALS): If the username or password was wrong, 
            // display the error message sent by the server in red text[cite: 1]
            messageDiv.textContent = data.error || "Invalid credentials.";
            messageDiv.style.color = "#d9534f"; // Red color
        }

    } catch (error) {
        // ERROR CATCHER: Triggers if the network request fails completely 
        // (e.g., if the Back-End VM is powered down, offline, or blocking requests via CORS)
        console.error("Connection error:", error);
        messageDiv.textContent = "Unable to connect to the server. Check network/CORS.";
        messageDiv.style.color = "#d9534f"; // Red color
    }
});