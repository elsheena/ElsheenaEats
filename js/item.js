import { apiRequest, updateCartCounter } from './api.js';

const API_ENDPOINTS = {
    dish: (id) => `/api/dish/${id}`,
    ratingCheck: (id) => `/api/dish/${id}/rating/check`,
    setRating: (id, score) => `/api/dish/${id}/rating?ratingScore=${score}`,
    basketDish: (id) => `/api/basket/dish/${id}`,
    orders: '/api/order',
    orderDetails: (id) => `/api/order/${id}`
};

let currentDish = null;
let canRate = false;

async function updateCartQuantity() {
    try {
        const cart = await apiRequest('/api/basket', 'GET');
        if (!cart || !Array.isArray(cart)) return;
        
        const quantities = {};
        cart.forEach(item => {
            quantities[item.id] = item.amount;
        });
        
        document.querySelectorAll('.quantity').forEach(element => {
            const dishId = element.dataset.dishId;
            if (dishId) {
                element.textContent = quantities[dishId] || 0;
            }
        });

        await updateCartCounter();
    } catch (error) {
        console.error('Error updating cart quantities:', error);
    }
}

async function checkDeliveredOrders(dishId) {
    try {
        const ordersList = await apiRequest(API_ENDPOINTS.orders, 'GET');
        console.log('Orders list:', ordersList);

        if (!Array.isArray(ordersList) || ordersList.length === 0) {
            return false;
        }

        for (const orderSummary of ordersList) {
            if (orderSummary.status === 'Delivered') {
                try {
                    const orderDetails = await apiRequest(API_ENDPOINTS.orderDetails(orderSummary.id), 'GET');
                    console.log('Order details:', orderDetails);

                    if (orderDetails && Array.isArray(orderDetails.dishes)) {
                        const hasDish = orderDetails.dishes.some(dish => dish.id === dishId);
                        if (hasDish) {
                            return true;
                        }
                    }
                } catch (orderError) {
                    console.error('Error fetching order details:', orderError);
                    continue;
                }
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error checking orders:', error);
        return false;
    }
}

window.addEventListener('popstate', () => {
    const pathParts = window.location.pathname.split('/');
    const dishId = pathParts[pathParts.length - 1];
    if (dishId) {
        loadDishDetails(dishId);
    }
});

async function loadDishDetails(dishId) {
    try {
        const dish = await apiRequest(API_ENDPOINTS.dish(dishId), 'GET');
        console.log('Dish data:', dish);
        if (!dish) {
            throw new Error('Dish not found');
        }
        currentDish = dish;
        renderDish(dish);
        
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const canRateResponse = await apiRequest(API_ENDPOINTS.ratingCheck(dishId), 'GET');
                console.log('Can rate response:', canRateResponse);
                canRate = canRateResponse === true;

                const hasDeliveredOrder = await checkDeliveredOrders(dishId);
                console.log('Has delivered order:', hasDeliveredOrder);
                
                const ratingControls = document.getElementById('rating-controls');
                if (ratingControls) {
                    ratingControls.style.display = 'flex';
                    
                    if (canRate && hasDeliveredOrder) {
                        ratingControls.innerHTML = `
                            <span>Rate this dish (0-10):</span>
                            <div class="rating-stars">
                                ${Array.from({length: 11}, (_, i) => `
                                    <button class="star-btn" onclick="window.setRating(${i})" title="Rate ${i} points">
                                        ${i} ⭐
                                    </button>
                                `).join('')}
                            </div>
                        `;
                    } else {
                        let message;
                        if (!hasDeliveredOrder) {
                            message = '👋 You need to order and receive this dish before rating it';
                        } else if (!canRate && dish.rating !== null) {
                            message = '✨ You have already rated this dish!';
                        } else {
                            message = '⏳ Please wait for your order to be delivered before rating';
                        }
                        
                        ratingControls.innerHTML = `
                            <span class="rating-message">
                                ${message}
                            </span>
                        `;
                    }
                }
                await updateCartQuantity();
                await updateCartCounter();
            } catch (error) {
                console.error('Error checking rating ability:', error);
                if (error.message.includes('401')) {
                    window.location.href = 'login.html';
                    return;
                }
                const ratingControls = document.getElementById('rating-controls');
                if (ratingControls) {
                    ratingControls.style.display = 'flex';
                    ratingControls.innerHTML = `
                        <span class="rating-message">
                            ❌ Unable to check rating availability. Please try again later.
                        </span>
                    `;
                }
            }
        } else {
            const ratingControls = document.getElementById('rating-controls');
            if (ratingControls) {
                ratingControls.style.display = 'flex';
                ratingControls.innerHTML = `
                    <span class="rating-message">
                        🔒 <a href="login.html">Log in</a> to rate dishes!
                    </span>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading dish:', error);
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dishId = urlParams.get('id');
    
    if (!dishId) {
        window.location.href = 'index.html';
        return;
    }

    await loadDishDetails(dishId);
});

async function addToCart(dishId) {
    try {
        await apiRequest(API_ENDPOINTS.basketDish(dishId), 'POST');
        await updateCartQuantity();
        await updateCartCounter();
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

async function removeFromCart(dishId) {
    try {
        await apiRequest(`/api/basket/dish/${dishId}?increase=true`, 'DELETE');
        await updateCartQuantity();
        await updateCartCounter();
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
}

async function setRating(score) {
    try {
        if (!currentDish) {
            console.error('No dish selected');
            return;
        }

        if (score < 0 || score > 10) {
            alert('Rating must be between 0 and 10');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to rate dishes');
            return;
        }

        const response = await apiRequest(API_ENDPOINTS.setRating(currentDish.id, score), 'POST');
        if (response === true) {
            const updatedDish = await apiRequest(API_ENDPOINTS.dish(currentDish.id), 'GET');
            currentDish = updatedDish;
            renderDish(updatedDish);
            
            const ratingControls = document.getElementById('rating-controls');
            if (ratingControls) {
                ratingControls.innerHTML = `
                    <span class="rating-message">
                        ✨ Thanks for rating this dish with ${score} points!
                    </span>
                `;
            }
        }
    } catch (error) {
        console.error('Error setting rating:', error);
        if (error.message.includes('401')) {
            alert('Please log in to rate dishes');
        } else if (error.message.includes('403')) {
            alert('You need to order and receive this dish before rating it');
        } else {
            alert('Failed to set rating. Please try again.');
        }
    }
}

function formatRating(rating) {
    if (rating === null || rating === undefined) {
        return '⭐ No ratings yet';
    }
    const ratingNum = parseFloat(rating);
    if (!Number.isFinite(ratingNum)) {
        return '⭐ No ratings yet';
    }
    return `⭐ ${ratingNum.toFixed(1)}/10`;
}

function renderDish(dish) {
    const container = document.getElementById('dish-details');
    if (!container) return;

    const ratingControls = `
        <div id="rating-controls" class="rating-controls" style="display: none;">
            <span>Rate this dish (0-10):</span>
            <div class="rating-stars">
                ${Array.from({length: 11}, (_, i) => `
                    <button class="star-btn" onclick="window.setRating(${i})" title="Rate ${i} points">
                        ${i} ⭐
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="dish-image-large">
            <img src="${dish.image || 'images/placeholder.jpg'}" alt="${dish.name}">
        </div>
        <div class="dish-info-detailed">
            <div class="dish-header">
                <h1 class="dish-name">${dish.name}</h1>
                <span class="dish-price">${dish.price.toFixed(0)} ₽</span>
            </div>
            <div class="dish-meta">
                ${dish.vegetarian ? '<span class="vegetarian-badge">🌱 Vegetarian</span>' : ''}
                <span class="category-badge">${dish.category}</span>
                <span class="rating-display" title="Dish rating">${formatRating(dish.rating)}</span>
            </div>
            <p class="dish-description">${dish.description || 'No description available.'}</p>
            
            <div class="dish-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="removeFromCart('${dish.id}')">-</button>
                    <span class="quantity" data-dish-id="${dish.id}">0</span>
                    <button class="quantity-btn" onclick="addToCart('${dish.id}')">+</button>
                </div>
                ${ratingControls}
            </div>
        </div>
    `;
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.setRating = setRating;