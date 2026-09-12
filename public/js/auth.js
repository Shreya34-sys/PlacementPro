document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. Password Visibility Toggle (Eye Buttons)
    // ==========================================
    const eyeButtons = document.querySelectorAll('.eye-btn');
    eyeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            if (input && input.type === 'password') {
                input.type = 'text';
                button.textContent = '🙈';
            } else if (input) {
                input.type = 'password';
                button.textContent = '👁';
            }
        });
    });

    // ==========================================
    // 2. Signup Form Submission
    // ==========================================
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('fullName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }

            try {
                const response = await apiRequest('/api/auth/signup', 'POST', {
                    name,
                    email,
                    password
                });

                if (response && response.token) {
                    localStorage.setItem('token', response.token);
                    alert('Account created successfully!');
                    window.location.href = response.redirect || '/dashboard';
                } else {
                    alert(response?.message || 'Signup failed. Please try again.');
                }
            } catch (error) {
                console.error('Signup error:', error);
                alert(error.message || 'A server error occurred. Please try again later.');
            }
        });
    }

    // ==========================================
    // 3. Student Login Form Submission
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                alert('Please enter both email and password.');
                return;
            }

            try {
                const response = await apiRequest('/api/auth/student-login', 'POST', {
                    email,
                    password
                });

                if (response && response.token) {
                    localStorage.setItem('token', response.token);
                    alert('Login successful!');
                    window.location.href = response.redirect || '/dashboard';
                } else {
                    alert(response?.message || 'Invalid credentials. Please try again.');
                }
            } catch (error) {
                console.error('Login Error:', error);
                alert(error.message || 'Could not connect to server. Please check your network.');
            }
        });
    }

    // ==========================================
    // 4. Admin Password Login Handler
    // ==========================================
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('adminEmail').value.trim();
            const password = document.getElementById('adminPassword').value;

            if (!email || !password) {
                alert('Please provide both admin email and password.');
                return;
            }

            try {
                const response = await apiRequest('/api/auth/admin-login', 'POST', { email, password });

                if (response && response.token) {
                    localStorage.setItem('adminToken', response.token);
                    alert('Admin authentication successful!');
                    window.location.href = response.redirect || '/admin-dashboard';
                } else {
                    alert(response?.message || 'Invalid admin credentials.');
                }
            } catch (error) {
                console.error('Admin Login Error:', error);
                alert(error.message || 'Server error during admin login.');
            }
        });
    }

    // ==========================================
    // 5. Admin Magic Link Login Handler
    // ==========================================
    const btnMagicLink = document.getElementById('btnMagicLink');
    if (btnMagicLink) {
        btnMagicLink.addEventListener('click', async () => {
            const emailInput = document.getElementById('adminEmail');
            const email = emailInput ? emailInput.value.trim() : '';

            if (!email) {
                alert('Please enter your admin email above first before requesting a magic link.');
                emailInput?.focus();
                return;
            }

            btnMagicLink.disabled = true;
            btnMagicLink.textContent = '⏳ Dispatching Magic Link...';

            try {
                const response = await apiRequest('/api/auth/admin-magic-link', 'POST', { email });
                alert(response?.message || 'Magic link dispatched! Check your admin inbox.');
            } catch (error) {
                console.error('Magic Link Error:', error);
                alert(error.message || 'Failed to send magic link. Ensure admin email is correct.');
            } finally {
                btnMagicLink.disabled = false;
                btnMagicLink.textContent = '✉ Login with Magic Email Link';
            }
        });
    }

}); // Properly closes DOMContentLoaded listener