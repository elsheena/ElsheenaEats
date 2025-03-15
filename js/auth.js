import { apiRequest } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        console.log('Email:', email);
        console.log('Password:', password);

        try {
            const data = await apiRequest('/api/account/login', 'POST', { email, password });
            console.log('Login response data:', data);
            console.log('Token before storing:', data.token);
            localStorage.setItem('token', data.token);
            console.log('Token stored:', localStorage.getItem('token'));
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        }
    });

    document.getElementById('toggle-password-login').addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.textContent = type === 'password' ? 'Show' : 'Hide';
    });
});

const token = localStorage.getItem('token');
console.log('Retrieved token:', token);

const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
};
