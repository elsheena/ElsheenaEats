import { apiRequest, updateCartCounter, getDish, setRating, checkRating, removeFromCart, addToCart } from './api.js';
import { getCleanUrl, getRandomLoadingIcon } from './main.js';

let currentDish = null;
let canRate = false;

async function updateCartQuantity() {
    try {
        const cart = await apiRequest(API_ENDPOINTS.basket, 'GET');
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

window.addEventListener('popstate', () => {
    const pathParts = window.location.pathname.split('/');
    const dishId = pathParts[pathParts.length - 1];
    if (dishId) {
        loadDishDetails(dishId);
    }
});

async function loadDishDetails(dishId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = getCleanUrl('login');
            return;
        }

        console.log('Loading dish:', dishId);
        const dishDetails = await getDish(dishId);
        console.log('Dish details:', dishDetails);
        
        renderDishDetails(dishDetails);
    } catch (error) {
        console.error('Error in loadDishDetails:', error);
        if (error.status === 401) {
            window.location.href = getCleanUrl('login');
            return;
        }
        displayError();
    }
}

function setupBackButton() {
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        const referrer = document.referrer;
        const currentDomain = window.location.origin;

        if (referrer && referrer.startsWith(currentDomain)) {
            const referrerPath = new URL(referrer).pathname;
            
            if (referrerPath.includes('/cart')) {
                backButton.textContent = '← Back to Cart';
                backButton.href = getCleanUrl('cart');
            } else if (referrerPath.includes('/orders')) {
                backButton.textContent = '← Back to Orders';
                backButton.href = getCleanUrl('orders');
            } else if (referrerPath.includes('/order')) {
                backButton.textContent = '← Back to Order';
                backButton.href = document.referrer;
            } else {
                backButton.textContent = '← Back to Menu';
                backButton.href = getCleanUrl('index');
            }
        } else {
            backButton.textContent = '← Back to Menu';
            backButton.href = getCleanUrl('index');
        }

        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const pathParts = window.location.pathname.split('/');
    const dishId = pathParts[pathParts.length - 1];
    
    if (!dishId) {
        console.error('No dish ID provided');
        window.location.href = '/';
        return;
    }

    try {
        await loadDishDetails(dishId);
        setupBackButton();
    } catch (error) {
        console.error('Error loading dish:', error);
        window.location.href = '/';
    }
});

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

        const response = await apiRequest(API_ENDPOINTS.dishRatingSet(currentDish.id, score), 'POST');
        if (response === true) {
            const updatedDish = await apiRequest(API_ENDPOINTS.dishId(currentDish.id), 'GET');
            currentDish = updatedDish;
            renderDish(updatedDish);
            
            const ratingControls = document.getElementById('rating-controls');
            if (ratingControls) {
                ratingControls.innerHTML = `
                    <span class="rating-message">
                        ✨ Thanks for rating this dish! ${'⭐'.repeat(score)}
                    </span>
                `;
            }

            await updateCartQuantity();
            await updateCartCounter();
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
        return '★ No ratings yet';
    }
    const ratingNum = parseFloat(rating);
    if (!Number.isFinite(ratingNum)) {
        return '★ No ratings yet';
    }
    
    const starCount = ratingNum / 2;
    const fullStars = Math.floor(starCount);
    const hasHalfStar = starCount % 1 >= 0.5;
    
    return `<div class="rating-stars-display">
        ${Array.from({length: 5}, (_, i) => `
            <div class="star-container-display">
                <span class="star-display full ${i < fullStars ? 'active' : ''}">★</span>
                <span class="star-display half ${i < fullStars || (i === fullStars && hasHalfStar) ? 'active' : ''}">★</span>
            </div>
        `).join('')}
        <span class="rating-number">${ratingNum.toFixed(1)}/10</span>
    </div>`;
}

function renderDish(dish) {
    const container = document.getElementById('dish-details');
    if (!container) return;

    const ratingControls = `
        <div id="rating-controls" class="rating-controls" style="display: none;">
            <span>Rate this dish:</span>
            <div class="rating-stars">
                ${Array.from({length: 5}, (_, i) => `
                    <div class="star-container">
                        <button class="star-btn half" 
                                onclick="window.setRating(${(i + 0.5) * 2})" 
                                onmouseover="window.highlightStars(${i + 0.5})"
                                onmouseout="window.resetStars()"
                                data-rating="${i + 0.5}">
                            ★
                        </button>
                        <button class="star-btn full" 
                                onclick="window.setRating(${(i + 1.0) * 2})" 
                                onmouseover="window.highlightStars(${i + 1})"
                                onmouseout="window.resetStars()"
                                data-rating="${i + 1}">
                            ★
                        </button>
                    </div>
                `).join('')}
            </div>
            <span class="rating-preview"></span>
        </div>
    `;

    container.innerHTML = `
        <div class="dish-image-large">
            <img src="${dish.image || getRandomLoadingIcon()}" 
                 alt="${dish.name}"
                 onerror="this.src='${getRandomLoadingIcon()}'">
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

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star-container');
    const preview = document.querySelector('.rating-preview');
    
    stars.forEach((container, index) => {
        const halfStar = container.querySelector('.half');
        const fullStar = container.querySelector('.full');
        
        if (index + 0.5 <= rating) {
            halfStar.classList.add('active');
        } else {
            halfStar.classList.remove('active');
        }
        
        if (index + 1 <= rating) {
            fullStar.classList.add('active');
        } else {
            fullStar.classList.remove('active');
        }
    });
    
    preview.textContent = `${(rating * 2).toFixed(1)}/10`;
}

function resetStars() {
    const stars = document.querySelectorAll('.star-container');
    const preview = document.querySelector('.rating-preview');
    stars.forEach(container => {
        const halfStar = container.querySelector('.half');
        const fullStar = container.querySelector('.full');
        halfStar.classList.remove('active');
        fullStar.classList.remove('active');
    });
    preview.textContent = '';
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.setRating = setRating;
window.highlightStars = highlightStars;
window.resetStars = resetStars;