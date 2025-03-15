import { updateCartCounter, validateToken, getOrder } from './api.js';

const PUBLIC_PAGES = ['/login', '/registration', '/register'];

async function updateAuthUI() {
    const isAuthenticated = await validateToken();
    
    document.querySelectorAll('.quantity-controls').forEach(control => {
        control.style.display = isAuthenticated ? 'flex' : 'none';
    });
    
    document.querySelectorAll('.rating-controls').forEach(control => {
        control.style.display = isAuthenticated ? 'flex' : 'none';
    });

    document.querySelectorAll('.auth-required').forEach(el => {
        el.style.display = isAuthenticated ? 'block' : 'none';
    });
    
    document.querySelectorAll('.auth-hide').forEach(el => {
        el.style.display = isAuthenticated ? 'none' : 'block';
    });
}

async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(`/components/${componentPath}`);
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

function getRandomLoadingIcon() {
    const icons = [
        '../images/loading-plate.svg',
        '../images/loading-chef.svg',
        '../images/loading-cooking.svg',
        '../images/loading-plating.svg',
        '../images/loading-menu.svg',
        '../images/loading-nothing.svg',
        '../images/loading-icon.svg',
        '../images/loading-meme.svg',
        '../images/loading-confused-chef.svg',
        '../images/loading-cooking-fail.svg',
        '../images/loading-searching.svg',
        '../images/loading-cooking.svg',
        '../images/loading-plating.svg',
        '../images/loading-menu.svg'
    ];
    return icons[Math.floor(Math.random() * icons.length)];
}

function getErrorLoadingIcon() {
    const memeIcons = [
        '../images/loading-meme.svg',
        '../images/loading-nothing.svg',
        '../images/loading-confused-chef.svg',
        '../images/loading-cooking-fail.svg',
        '../images/loading-searching.svg',
        '../images/loading-cooking.svg',
        '../images/loading-plating.svg',
        '../images/loading-menu.svg'
    ];
    return memeIcons[Math.floor(Math.random() * memeIcons.length)];
}

async function checkAuth() {
    const currentPath = window.location.pathname;
    
    if (PUBLIC_PAGES.some(page => currentPath.includes(page))) {
        return true;
    }

    const isValid = await validateToken();
    if (!isValid) {
        window.location.href = getCleanUrl('login');
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Application initialized');
    
    try {
        await Promise.all([
            loadComponent('header-placeholder', 'header.html'),
            loadComponent('footer-placeholder', 'footer.html')
        ]);
        
        const currentPath = window.location.pathname;
        if (!PUBLIC_PAGES.some(page => currentPath.includes(page))) {
            await checkAuth();
        }
        
        updateAuthUI();
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = getCleanUrl('login');
            });
        }
        
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

function getCleanUrl(page, params = {}) {
    let url = '';
    
    switch (page) {
        case 'login':
            url = '/login';
            break;
        case 'registration':
            url = '/registration';
            break;
        case 'item':
            if (!params.id) {
                console.error('Item ID is required');
                return '/';
            }
            url = `/item/${params.id}`;
            break;
        case 'order':
            if (!params.id) {
                console.error('Order ID is required');
                return '/orders';
            }
            url = `/order/${params.id}`;
            break;
        case 'index':
            url = '/';
            break;
        default:
            url = `/${page}`;
    }
    
    return url;
}

export { updateAuthUI, getCleanUrl, checkAuth, getRandomLoadingIcon, getErrorLoadingIcon };