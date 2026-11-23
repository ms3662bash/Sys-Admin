document.addEventListener('DOMContentLoaded', () => {
    // Defines the destination URL for the Back-End VM API endpoint that handles registration
    const BACKEND_URL = API_BASE + "/api/auth/register";

    const registerForm = document.querySelector('form[action="/register"]');
    
    if (!registerForm) return;

    const messageContainer = document.getElementById("message");

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Cleared previous messages
        messageContainer.textContent = '';
        messageContainer.style.color = '';
        // extract input values
        const usernameInput = registerForm.querySelector('input[name="username"]')
        const emailInput = registerForm.querySelector('input[name="email"]');
        const passwordInput = registerForm.querySelector('input[name="password"]');

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        //==============================================
        //Password validation rules
        //===============================================
        if (!username || !email || !password){
            showError('All fields are required.');
            return;
        }
        //email format verification
        //===========================
        const emailRule = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRule.test(email)){
            showError('Please enter a valid email address.');
            return;
        }
    //======================================================================
        const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,30}$/;
        if (!passwordRule.test(password)) {
                showError('Password must be 10-30 characters long and include at least one lower and upper case letter, one number, and one special character.');
                return;
            }
        

        const payload = { username, email, password };

        try {
            // Updated to use BACKEND_URL pointing to Team Member 2's VM
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess(data.message || 'Registration successful! Redirecting to login...');
                registerForm.reset();
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showError(data.error || 'Registration failed. Please try again.');
            }
        } catch (err) {
            console.error('Network or server error:', err);
            showError('Unable to connect to the server. Please check your connection.');
        }
    });

    function showMessage(text, color) {
        messageContainer.textContent = text;
        messageContainer.style.color = color;
    }
    function showError(text) { showMessage(text, "#d9534f"); }
    function showSuccess(text) { showMessage(text, "#5cb85c"); }
});
