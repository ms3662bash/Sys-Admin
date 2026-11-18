document.addEventListener('DOMContentLoaded', () => {
    // Defines the destination URL for the Back-End VM API endpoint that handles registration
    const BACKEND_URL = "http://<BACKEND_VM_IP>:3000/api/auth/register"; // (Check exact route with Team Member 2)

    const registerForm = document.querySelector('form[action="/register"]');
    
    if (!registerForm) return;

    // ... (your existing message container code) ...

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // ... (your existing validation code) ...

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

    // ... (your showError and showSuccess functions) ...
});
