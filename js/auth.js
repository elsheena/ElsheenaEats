8import { login } from './api.js';
import { getCleanUrl } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const data = await login(email, password);
                localStorage.setItem('token', data.token);
                window.location.href = getCleanUrl('index');
            } catch (error) {
                console.error('Login error:', error);
                if (error.message == "HTTP error! status: 400"){
                    alert('Login failed: Username or Password is not correct');
                } else {
                    alert('Login failed: ' + error.message);
                }
            }
        });
    }

    const togglePasswordBtn = document.getElementById('toggle-password-login');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? 'Show' : 'Hide';
        });
    }
});
