import { getCleanUrl } from './main.js';
import { loadCart } from './cart.js';
import { updateQuantityDisplay } from './menu.js';

export const API_BASE_URL = 'https://food-delivery.int.kreosoft.space';

const API_ENDPOINTS = {
    basket: '/api/basket',
    basketDish: (id) => `/api/basket/dish/${id}`,
    dish: '/api/dish',
    dishId: (id) => `/api/dish/${id}`,
    dishRating: (id) => `/api/dish/${id}/rating`,
    dishRatingCheck: (id) => `/api/dish/${id}/rating/check`,
    dishRatingSet: (id) => `/api/dish/${id}/rating?ratingScore=`,
    order: '/api/order',
    orderId: (id) => `/api/order/${id}`,
    orderConfirm: (id) => `/api/order/${id}/status`,
    accountLogin: '/api/account/login',
    accountRegister: '/api/account/register',
    accountProfile: '/api/account/profile',
    accountLogout: '/api/account/logout',
    accountUpdate: '/api/account/profile',
    accountValidate: '/api/account/profile',
};

export async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;
    const PUBLIC_PAGES = ['/login', '/registration', '/register'];
    const isPublicPage = PUBLIC_PAGES.some(page => currentPath.includes(page));
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
        console.log(`Making ${method} request to:`, endpoint);
        const response = await fetch(API_BASE_URL + endpoint, {
            method,
            headers,
            ...(data && { body: JSON.stringify(data) })
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            if (!isPublicPage) {
                alert('Your session has expired. Please log in again.');
                window.location.href = getCleanUrl('login');
            }
            throw new Error('Unauthorized');
        }
        if (response.status === 403) {
            throw new Error('403');
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (response.status === 204 || method === 'DELETE') {
            return true;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            console.log('API response:', result);
            return result;
        }
        return true;

    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

export async function login(email, password) {
    return apiRequest(API_ENDPOINTS.accountLogin, 'POST', { email, password });
}

export async function register(userData) {
    return apiRequest(API_ENDPOINTS.accountRegister, 'POST', userData);
}

export async function logout() {
    return apiRequest(API_ENDPOINTS.accountLogout, 'POST');
}

export async function getProfile() {
    return apiRequest(API_ENDPOINTS.accountProfile, 'GET');
}

export async function updateProfile(userData) {
    return apiRequest(API_ENDPOINTS.accountUpdate, 'PUT', userData);
}

export async function getDishes(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.categories) {
        params.categories.forEach(category => queryParams.append('categories', category));
    }
    if (params.vegetarian !== undefined) {
        queryParams.append('vegetarian', params.vegetarian);
    }
    if (params.sorting) {
        queryParams.append('sorting', params.sorting);
    }
    if (params.page) {
        queryParams.append('page', params.page);
    }
    return apiRequest(API_ENDPOINTS.dish + `?${queryParams}`);
}

export async function getDish(id) {
    return apiRequest(API_ENDPOINTS.dishId(id));
}

export async function checkRating(dishId) {
    return apiRequest(API_ENDPOINTS.dishRatingCheck(dishId));
}

export async function setRating(dishId, rating) {
    return apiRequest(API_ENDPOINTS.dishRatingSet(dishId) + rating, 'POST');
}

export async function getCart() {
    try {
        const response = await apiRequest(API_ENDPOINTS.basket, 'GET');
        return response;
    } catch (error) {
        console.error('Error getting cart:', error);
        return [];
    }
}

export async function updateCartCounter() {
    const currentPath = window.location.pathname;
    const PUBLIC_PAGES = ['/login', '/registration',];
    
    if (PUBLIC_PAGES.some(page => currentPath.includes(page))) {
        return;
    }

    try {
        const cartData = await getCart();
        const cartCounter = document.getElementById('cart-counter');
        
        if (cartCounter) {
            if (Array.isArray(cartData) && cartData.length > 0) {
                const totalQuantity = cartData.reduce((total, item) => total + item.amount, 0);
                cartCounter.textContent = totalQuantity;
                cartCounter.style.display = 'inline-block';
            } else {
                cartCounter.textContent = '0';
                cartCounter.style.display = 'inline-block';
            }
        }
    } catch (error) {
        console.error('Error updating cart counter:', error);
        const cartCounter = document.getElementById('cart-counter');
        if (cartCounter) {
            cartCounter.textContent = '0';
            cartCounter.style.display = 'none';
        }
    }
}

export async function addToCart(dishId) {
    try {
        await apiRequest(API_ENDPOINTS.basketDish(dishId), 'POST');
        await loadCart();
        await updateQuantityDisplay();
        await updateCartCounter();
        return true;
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
}

export async function removeFromCart(dishId, decrease = true) {
    try {
        await apiRequest(API_ENDPOINTS.basketDish(dishId) + `?increase=${decrease}`, 'DELETE');
        await loadCart();
        await updateQuantityDisplay();
        await updateCartCounter();
        return true;
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }
}

export async function removeItemCompletely(dishId) {
    try {
        await apiRequest(API_ENDPOINTS.basketDish(dishId) + `?increase=false`, 'DELETE');
        await loadCart();
        await updateCartCounter();
        const updatedCart = await getCart(); 
        return updatedCart;
    } catch (error) {
        console.error('Error removing item from cart:', error);
        throw error;
    }
}

export async function getOrders() {
    return apiRequest(API_ENDPOINTS.order);
}

export async function getOrder(id) {
    return apiRequest(API_ENDPOINTS.orderId(id));
}

export async function createOrder(orderData) {
    return apiRequest(API_ENDPOINTS.order, 'POST', orderData);
}

export async function confirmDelivery(orderId) {
    return apiRequest(API_ENDPOINTS.orderConfirm(orderId), 'POST');
}

export async function validateToken() {
    const currentPath = window.location.pathname;
    const PUBLIC_PAGES = ['/login', '/registration', '/register'];
    
    if (PUBLIC_PAGES.some(page => currentPath.includes(page))) {
        return true;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        return false;
    }
    
    try {
        await apiRequest(API_ENDPOINTS.accountValidate, 'GET');
        return true;
    } catch (error) {
        if (error.status === 401) {
            localStorage.removeItem('token');
            return false;
        }
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const currentPath = window.location.pathname;
    const PUBLIC_PAGES = ['/login', '/registration', '/register'];
    
    if (!PUBLIC_PAGES.some(page => currentPath.includes(page)) && localStorage.getItem('token')) {
        await getCart();
    }
});
