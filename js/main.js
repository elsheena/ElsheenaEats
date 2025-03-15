import { updateCartCounter } from './api.js';

function updateAuthUI() {
    const token = localStorage.getItem('token');
    const authElements = document.querySelectorAll('.auth-required');
    const hideElements = document.querySelectorAll('.auth-hide');

    if (token) {
        authElements.forEach(el => el.style.display = 'block');
        hideElements.forEach(el => el.style.display = 'none');
    } else {
        authElements.forEach(el => el.style.display = 'none');
        hideElements.forEach(el => el.style.display = 'block');
    }
}

async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(`../components/${componentPath}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const content = await response.text();
        
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = content;
            
            if (elementId === 'header-placeholder') {
                await updateCartCounter();
            }
        }
    } catch (error) {
        console.error(`Error loading ${elementId}:`, error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Application initialized');
    
    try {
        await Promise.all([
            loadComponent('header-placeholder', 'header.html'),
            loadComponent('footer-placeholder', 'footer.html')
        ]);
        
        updateAuthUI();
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            });
        }
        
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

export { updateAuthUI };