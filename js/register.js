import { apiRequest, register } from './api.js';
import { getCleanUrl } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Toggle password button:', document.getElementById('toggle-password-register'));
    console.log('Password input:', document.getElementById('register-password'));

    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value) {
                if (!value.startsWith('7')) {
                    value = '7' + value;
                }
                
                if (value.length <= 11) {
                    value = value.replace(/(\d{1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/, function(match, p1, p2, p3, p4, p5) {
                        let parts = ['+' + p1];
                        if (p2) parts.push(' (' + p2 + ')');
                        if (p3) parts.push(' ' + p3);
                        if (p4) parts.push('-' + p4);
                        if (p5) parts.push('-' + p5);
                        return parts.join('');
                    });
                }
            }
            
            e.target.value = value;
        });

        phoneInput.placeholder = '+7 (xxx) xxx-xx-xx';
        phoneInput.pattern = '\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}';
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('register-password');
            const phoneInput = document.getElementById('phone');
            const addressInput = document.getElementById('address');
            const birthdateInput = document.getElementById('birthdate');
            const genderInputs = document.querySelectorAll('input[name="gender"]');

            const selectedGender = Array.from(genderInputs).find(input => input.checked);

            if (nameInput && emailInput && passwordInput && addressInput && birthdateInput && selectedGender) {
                const phoneNumber = phoneInput ? phoneInput.value : null;
                const formattedPhone = phoneNumber ? phoneNumber.replace(/[^\d+]/g, '') : null;

                const userData = {
                    fullName: nameInput.value.trim(),
                    email: emailInput.value.trim(),
                    password: passwordInput.value,
                    phoneNumber: formattedPhone,
                    address: addressInput.value.trim(),
                    birthDate: birthdateInput.value || null,
                    gender: selectedGender.value
                };

                if (!validatePassword(userData.password)) {
                    alert('Please fix the password errors before submitting.');
                    return;
                }

                try {
                    const response = await register(userData);
                    if (response) {
                        alert('Registration successful! You can now log in.');
                        window.location.href = getCleanUrl('login');
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
