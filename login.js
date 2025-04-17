// Specific login credentials
const VALID_EMAIL = "user@example.com";
const VALID_PASSWORD = "password123";

// Admin credentials (in a real app, this would be stored securely in a database)
const ADMIN_CREDENTIALS = {
    username: 'Subhankar Gaen',
    email: 'gaensubhankar@gmail.com',
    password: 'Subham@143',
    secretKey: 'Quantum Coder',
    pin: '7077',
    verificationCode: 'QC2025'
};

// Initialize registered users array from localStorage or create empty array
let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signupLink = document.getElementById('signup-link');
    const signupModal = document.getElementById('signup-modal');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const adminLoginCheckbox = document.getElementById('admin-login');
    const adminVerificationModal = document.getElementById('admin-verification-modal');
    const adminVerificationForm = document.getElementById('admin-verification-form');
    const googleSignIn = document.getElementById('google-signin');
    const forgotPassword = document.getElementById('forgot-password');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const closeModal = document.querySelectorAll('.close-modal');
    const resetPasswordForm = document.getElementById('reset-password-form');

    // Add error message container
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.color = 'red';
    errorMessage.style.marginTop = '10px';
    errorMessage.style.textAlign = 'center';
    loginForm.appendChild(errorMessage);

    // Handle admin login checkbox
    adminLoginCheckbox.addEventListener('change', function() {
        if (this.checked) {
            adminVerificationModal.style.display = 'block';
        }
    });

    // Admin verification form submission
    adminVerificationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const secretKey = document.getElementById('admin-secret').value;
        const pin = document.getElementById('admin-pin').value;
        const verificationCode = document.getElementById('admin-code').value;

        // Clear any previous messages
        const previousMessage = adminVerificationForm.querySelector('.verification-message');
        if (previousMessage) {
            previousMessage.remove();
        }

        const verificationMessage = document.createElement('div');
        verificationMessage.style.marginTop = '10px';
        verificationMessage.style.textAlign = 'center';

        // Verify admin credentials
        if (secretKey === ADMIN_CREDENTIALS.secretKey && 
            pin === ADMIN_CREDENTIALS.pin && 
            verificationCode === ADMIN_CREDENTIALS.verificationCode) {
            verificationMessage.className = 'verification-message success';
            verificationMessage.style.color = 'green';
            verificationMessage.textContent = 'Admin verification successful! Redirecting to admin panel...';
            
            // Store admin login status
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('userEmail', ADMIN_CREDENTIALS.email);
            localStorage.setItem('username', ADMIN_CREDENTIALS.username);
            
            // Redirect to admin panel after 1 second
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            verificationMessage.className = 'verification-message error';
            verificationMessage.style.color = 'red';
            verificationMessage.textContent = 'Invalid verification details. Please try again.';
            adminLoginCheckbox.checked = false;
        }

        adminVerificationForm.appendChild(verificationMessage);
    });

    // Sign Up Link Click Handler
    signupLink.addEventListener('click', function(e) {
        e.preventDefault();
        signupModal.style.display = 'block';
    });

    // Close Modal Handler
    closeModal.forEach(button => {
        button.addEventListener('click', function() {
            signupModal.style.display = 'none';
            forgotPasswordModal.style.display = 'none';
            adminVerificationModal.style.display = 'none';
            // Uncheck admin login if modal is closed
            adminLoginCheckbox.checked = false;
        });
    });

    // Sign Up Form Submission
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Clear any previous messages
        const previousMessage = signupForm.querySelector('.signup-message');
        if (previousMessage) {
            previousMessage.remove();
        }

        const signupMessage = document.createElement('div');
        signupMessage.style.marginTop = '10px';
        signupMessage.style.textAlign = 'center';

        // Check if email is already registered
        const isEmailRegistered = registeredUsers.some(user => user.email === email);

        if (isEmailRegistered) {
            signupMessage.className = 'signup-message error';
            signupMessage.style.color = 'red';
            signupMessage.textContent = 'This email is already registered. Please login instead.';
        } else if (password !== confirmPassword) {
            signupMessage.className = 'signup-message error';
            signupMessage.style.color = 'red';
            signupMessage.textContent = 'Passwords do not match.';
        } else {
            // Register new user
            const newUser = {
                email: email,
                password: password,
                isAdmin: false
            };
            registeredUsers.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

            signupMessage.className = 'signup-message success';
            signupMessage.style.color = 'green';
            signupMessage.textContent = 'Account created successfully! Please login.';
            
            // Clear form and close modal after 2 seconds
            setTimeout(() => {
                signupModal.style.display = 'none';
                signupForm.reset();
            }, 2000);
        }

        signupForm.appendChild(signupMessage);
    });

    // Regular login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const username = usernameInput.value.trim();
        const isAdminLogin = adminLoginCheckbox.checked;
        
        // Clear previous error message
        errorMessage.textContent = '';
        
        // Check if email is registered
        const user = registeredUsers.find(user => user.email === email);
        
        if (!user) {
            errorMessage.textContent = 'This email is not registered. Please sign up first.';
            return;
        }

        if (password === user.password) {
            if (isAdminLogin) {
                // Check if user is actually an admin and matches the specific admin credentials
                if (user.isAdmin && 
                    user.email === ADMIN_CREDENTIALS.email && 
                    user.password === ADMIN_CREDENTIALS.password) {
                    // Store admin login status
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('isAdmin', 'true');
                    localStorage.setItem('userEmail', email);
                    localStorage.setItem('username', username);
                    
                    // Redirect to admin panel
                    window.location.href = 'admin.html';
                } else {
                    errorMessage.textContent = 'You do not have admin privileges.';
                    adminLoginCheckbox.checked = false;
                }
            } else {
                // Store regular login status
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('isAdmin', 'false');
                localStorage.setItem('userEmail', email);
                localStorage.setItem('username', username);
                
                // Redirect to index page
                window.location.href = 'index.html';
            }
        } else {
            errorMessage.textContent = 'Invalid password. Please try again.';
            passwordInput.value = '';
        }
    });

    // Google Sign-In
    googleSignIn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Google sign-in clicked');
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (email === VALID_EMAIL) {
            if (password === VALID_PASSWORD) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
                window.location.href = 'index.html';
            } else {
                errorMessage.textContent = 'Invalid password for Google sign-in.';
                passwordInput.value = '';
            }
        } else {
            errorMessage.textContent = 'This email is not registered. Please check your email or sign up.';
            emailInput.value = '';
            passwordInput.value = '';
        }
    });

    // Forgot Password
    forgotPassword.addEventListener('click', function(e) {
        e.preventDefault();
        forgotPasswordModal.style.display = 'block';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === signupModal || e.target === forgotPasswordModal || e.target === adminVerificationModal) {
            signupModal.style.display = 'none';
            forgotPasswordModal.style.display = 'none';
            adminVerificationModal.style.display = 'none';
            // Uncheck admin login if modal is closed
            adminLoginCheckbox.checked = false;
        }
    });

    // Handle password reset form submission
    resetPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const resetEmail = document.getElementById('reset-email').value.trim();
        
        // Check if email exists in registered users
        const user = registeredUsers.find(user => user.email === resetEmail);
        
        if (user) {
            // In a real application, you would send an email here
            // For demo purposes, we'll just show a success message
            const resetMessage = document.createElement('div');
            resetMessage.className = 'reset-message success';
            resetMessage.style.color = 'green';
            resetMessage.style.marginTop = '10px';
            resetMessage.style.textAlign = 'center';
            resetMessage.textContent = 'Password reset link has been sent to your email.';
            
            // Clear any previous messages
            const previousMessage = resetPasswordForm.querySelector('.reset-message');
            if (previousMessage) {
                previousMessage.remove();
            }
            
            resetPasswordForm.appendChild(resetMessage);
            
            // Close modal after 3 seconds
            setTimeout(() => {
                forgotPasswordModal.style.display = 'none';
                document.getElementById('reset-email').value = '';
                resetMessage.remove();
            }, 3000);
        } else {
            const resetMessage = document.createElement('div');
            resetMessage.className = 'reset-message error';
            resetMessage.style.color = 'red';
            resetMessage.style.marginTop = '10px';
            resetMessage.style.textAlign = 'center';
            resetMessage.textContent = 'Email not found in our system.';
            
            // Clear any previous messages
            const previousMessage = resetPasswordForm.querySelector('.reset-message');
            if (previousMessage) {
                previousMessage.remove();
            }
            
            resetPasswordForm.appendChild(resetMessage);
        }
    });
}); 