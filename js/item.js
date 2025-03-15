import { apiRequest } from './api.js';

const API_ENDPOINTS = {
    dish: (id) => `/api/dish/${id}`,
    ratingCheck: (id) => `/api/dish/${id}/rating/check`,
    setRating: (id, score) => `/api/dish/${id}/rating?ratingScore=${score}`,
    basketDish: (id) => `/api/basket/dish/${id}`
};

let currentDish = null;
let canRate = false;

async function updateCartQuantity() {
    try {
        const cart = await apiRequest('/api/basket', 'GET');
        if (!cart || !cart.dishes) return;
        
        const quantities = {};
        cart.dishes.forEach(item => {
            quantities[item.id] = item.amount;
        });
        
        document.querySelectorAll('.quantity').forEach(element => {
            const dishId = element.dataset.dishId;
            if (dishId) {
                element.textContent = quantities[dishId] || 0;
            }
        });
    } catch (error) {
        console.error('Error updating cart quantities:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dishId = urlParams.get('id');
    
    if (!dishId) {
        window.location.href = '/';
        return;
    }

    try {
        const dish = await apiRequest(API_ENDPOINTS.dish(dishId), 'GET');
        console.log('Loaded dish:', dish);
        if (!dish) {
            throw new Error('Dish not found');
        }
        currentDish = dish;
        renderDish(dish);
        
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const ratingCheckResponse = await apiRequest(API_ENDPOINTS.ratingCheck(dishId), 'GET');
                canRate = ratingCheckResponse === true;
                console.log('Can rate:', canRate);
                const ratingControls = document.getElementById('rating-controls');
                if (ratingControls) {
                    ratingControls.style.display = canRate ? 'flex' : 'none';
                }
                await updateCartQuantity();
            } catch (error) {
                if (error.message.includes('401')) {
                    console.log('User not authorized to rate');
                } else {
                    console.error('Error checking rating ability:', error);
                }
                canRate = false;
            }
        }
    } catch (error) {
        console.error('Error initializing dish page:', error);
        window.location.href = '/';
    }
});

async function addToCart(dishId) {
    try {
        await apiRequest(API_ENDPOINTS.basketDish(dishId), 'POST');
        await updateCartQuantity();
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

async function removeFromCart(dishId) {
    try {
        await apiRequest(API_ENDPOINTS.basketDish(dishId), 'DELETE');
        await updateCartQuantity();
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
}

async function setRating(score) {
    if (!currentDish || !canRate) return;

    try {
        await apiRequest(API_ENDPOINTS.setRating(currentDish.id, score), 'POST');
        console.log('Rating set successfully');
        
        const updatedDish = await apiRequest(API_ENDPOINTS.dish(currentDish.id), 'GET');
        console.log('Updated dish:', updatedDish);
        currentDish = updatedDish;
        renderDish(updatedDish);
        
        canRate = false;
        const ratingControls = document.getElementById('rating-controls');
        if (ratingControls) {
            ratingControls.style.display = 'none';
        }
    } catch (error) {
        console.error('Error setting rating:', error);
    }
}

function renderDish(dish) {
    const container = document.getElementById('dish-details');
    if (!container) return;

    console.log('Rendering dish with rating:', dish.rating);

    let ratingDisplay;
    if (dish.rating === null) {
        ratingDisplay = 'Not rated yet';
    } else {
        const rating = parseFloat(dish.rating);
        ratingDisplay = Number.isFinite(rating) ? `⭐ ${rating.toFixed(2)}` : 'Not rated yet';
    }

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
                <span class="rating-display">${ratingDisplay}</span>
            </div>
            <p class="dish-description">${dish.description || 'No description available.'}</p>
            
            <div class="dish-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="removeFromCart('${dish.id}')">-</button>
                    <span class="quantity" data-dish-id="${dish.id}">0</span>
                    <button class="quantity-btn" onclick="addToCart('${dish.id}')">+</button>
                </div>
                
                <div id="rating-controls" class="rating-controls" style="display: none;">
                    <span>Rate this dish:</span>
                    <div class="rating-stars">
                        ${[1, 2, 3, 4, 5].map(score => `
                            <button class="star-btn" onclick="setRating(${score})">
                                ${score}★
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.setRating = setRating; 