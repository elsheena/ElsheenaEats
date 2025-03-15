export const API_BASE_URL = 'https://food-delivery.int.kreosoft.space';

export async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: body ? JSON.stringify(body) : null
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('login.html')) {
                alert('Your session has expired. Please log in again.');
                window.location.href = 'login.html';
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
            return await response.json();
        }
        return true;

    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

export async function login(email, password) {
    return apiRequest('/api/account/login', 'POST', { email, password });
}

export async function register(userData) {
    return apiRequest('/api/account/register', 'POST', userData);
}

export async function logout() {
    return apiRequest('/api/account/logout', 'POST');
}

export async function getProfile() {
    return apiRequest('/api/account/profile', 'GET');
}

export async function updateProfile(userData) {
    return apiRequest('/api/account/profile', 'PUT', userData);
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
    return apiRequest(`/api/dish?${queryParams}`);
}

export async function getDish(id) {
    return apiRequest(`/api/dish/${id}`);
}

export async function checkRating(dishId) {
    return apiRequest(`/api/dish/${dishId}/rating/check`);
}

export async function setRating(dishId, rating) {
    return apiRequest(`/api/dish/${dishId}/rating?ratingScore=${rating}`, 'POST');
}

export async function getCart() {
    try {
        const response = await apiRequest('/api/basket', 'GET');
        return response;
    } catch (error) {
        console.error('Error getting cart:', error);
        return [];
    }
}

export async function updateCartCounter() {
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
            cartCounter.style.display = 'inline-block';
        }
    }
}

export async function addToCart(dishId) {
    try {
        await apiRequest(`/api/basket/dish/${dishId}`, 'POST');
        await updateCartCounter();
        return true;
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
}

export async function removeFromCart(dishId, decrease = true) {
    try {
        await apiRequest(`/api/basket/dish/${dishId}?increase=${decrease}`, 'DELETE');
        await updateCartCounter();
        return true;
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }
}

export async function removeItemCompletely(dishId) {
    try {
        await apiRequest(`/api/basket/dish/${dishId}?increase=false`, 'DELETE');
        await updateCartCounter();
        const updatedCart = await getCart(); 
        return updatedCart;
    } catch (error) {
        console.error('Error removing item from cart:', error);
        throw error;
    }
}

export async function getOrders() {
    return apiRequest('/api/order');
}

export async function getOrder(id) {
    return apiRequest(`/api/order/${id}`);
}

export async function createOrder(orderData) {
    return apiRequest('/api/order', 'POST', orderData);
}

export async function confirmDelivery(orderId) {
    return apiRequest(`/api/order/${orderId}/status`, 'POST');
}

export async function validateToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        return false;
    }
    
    try {
        await apiRequest('/api/account/profile', 'GET');
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
    if (localStorage.getItem('token')) {
        await getCart();
    }
});
