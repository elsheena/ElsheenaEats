import { apiRequest } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Toggle password button:', document.getElementById('toggle-password-register'));
    console.log('Password input:', document.getElementById('register-password'));

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('register-password');
            const addressInput = document.getElementById('address');
            const birthdateInput = document.getElementById('birthdate');
            const genderInputs = document.querySelectorAll('input[name="gender"]');

            const selectedGender = Array.from(genderInputs).find(input => input.checked);

            if (nameInput && emailInput && passwordInput && addressInput && birthdateInput && selectedGender) {
                const userData = {
                    fullName: nameInput.value.trim(),
                    email: emailInput.value.trim(),
                    password: passwordInput.value,
                    address: addressInput.value.trim(),
                    birthDate: birthdateInput.value || null,
                    gender: selectedGender.value
                };

                if (!validatePassword(userData.password)) {
                    alert('Please fix the password errors before submitting.');
                    return;
                }

                try {
                    const response = await apiRequest('/api/account/register', 'POST', userData);
                    if (response) {
                        alert('Registration successful! You can now log in.');
                        window.location.href = 'login.html';
                    }
                } catch (error) {
                    console.error('Registration error:', error);
                    alert('Registration failed. Please try again.');
                }
            } else {
                console.error('Some form elements are missing');
                alert('Please fill in all required fields.');
            }
        });
    }

    const toggleButton = document.getElementById('toggle-password-register');
    const passwordInput = document.getElementById('register-password');
    
    if (toggleButton && passwordInput) {
        toggleButton.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? 'Show' : 'Hide';
        });
    }
});

function validatePassword(password) {
    const passwordFeedback = document.getElementById('password-feedback');
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/;

    if (regex.test(password)) {
        if (passwordFeedback) passwordFeedback.textContent = '';
        return true;
    } else {
        if (passwordFeedback) {
            passwordFeedback.textContent = 'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character.';
        }
        return false;
    }
}

document.getElementById('register-password').addEventListener('input', function() {
    validatePassword(this.value);
});
