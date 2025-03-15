import { API_BASE_URL, apiRequest, getCart, updateCartCounter } from './api.js';

const itemDetailsCache = new Map();

let cartItemsContainer;
let checkoutButton;
let cartTotal;

async function fetchItemDetails(itemId) {
    if (itemDetailsCache.has(itemId)) {
        return itemDetailsCache.get(itemId);
    }
    
    try {
        const itemData = await apiRequest(`/api/dish/${itemId}`, 'GET');
        itemDetailsCache.set(itemId, itemData);
        return itemData;
    } catch (error) {
        console.error('Failed to fetch item details:', error);
        return null;
    }
}

async function loadCart() {
    try {
        const cartData = await getCart();
        console.log('Cart data:', cartData);

        if (cartData && cartData.dishes && cartData.dishes.length > 0) {
            console.log('Rendering cart items');
            await renderCartItems(cartData.dishes);
            updateTotal(cartData.dishes);
            await updateCartCounter();
        } else {
            console.log('Cart is empty, displaying empty message');
            displayEmptyCart();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        displayEmptyCart();
    }
}

function displayEmptyCart() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) {
        console.error('Cart container not found');
        return;
    }
    
    cartContainer.innerHTML = `
        <div class="shopping-cart-empty">
            <p>Your cart is empty</p>
            <a href="/" class="btn btn-primary">Continue Shopping</a>
        </div>
    `;
    updateTotal(null);
}

async function renderCartItems(cartItems) {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) {
        console.error('Cart container not found');
        return;
    }

    console.log('Starting to render cart items:', cartItems);
    cartContainer.innerHTML = '';

    for (const item of cartItems) {
        try {
            console.log('Fetching details for item:', item.id);
            const dishDetails = await apiRequest(`/api/dish/${item.id}`, 'GET');
            console.log('Dish details:', dishDetails);

            const itemElement = document.createElement('div');
            itemElement.className = 'shopping-cart-item';
            itemElement.innerHTML = `
                <a href="item.html?id=${item.id}" class="shopping-cart-item-image">
                    <img src="${dishDetails.image || 'images/placeholder-food.jpg'}" 
                         alt="${dishDetails.name}"
                         onerror="this.src='images/placeholder-food.jpg'">
                </a>
                <div class="shopping-cart-item-details">
                    <a href="item.html?id=${item.id}" class="shopping-cart-item-name">
                        <h3>${dishDetails.name}</h3>
                    </a>
                    <p class="shopping-cart-item-price">${dishDetails.price} ₽</p>
                    ${dishDetails.vegetarian ? '<span class="vegetarian-badge">🌱 Vegetarian</span>' : ''}
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="removeFromCart('${item.id}')">-</button>
                    <span class="quantity" data-dish-id="${item.id}">${item.amount}</span>
                    <button class="quantity-btn" onclick="addToCart('${item.id}')">+</button>
                </div>
                <button class="btn btn-secondary remove-item" onclick="removeItemCompletely('${item.id}')">
                    🗑️ Remove
                </button>
            `;
            cartContainer.appendChild(itemElement);
        } catch (error) {
            console.error('Error rendering item:', item.id, error);
        }
    }
}

function updateTotal(cartItems) {
    const totalElement = document.getElementById('cart-total');
    if (!totalElement) {
        console.error('Total element not found');
        return;
    }

    if (!cartItems || !cartItems.length) {
        totalElement.textContent = '0 ₽';
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.style.display = 'none';
        }
        return;
    }

    const total = cartItems.reduce((sum, item) => {
        return sum + (item.price * item.amount);
    }, 0);

    totalElement.textContent = `${total} ₽`;
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.style.display = 'block';
    }
}

async function fetchCartItems() {
    try {
        const cartItems = await getCart();
        console.log('Cart items:', cartItems);

        if (!Array.isArray(cartItems)) {
            throw new Error('Unexpected response format - expected array');
        }
        
        await updateCartCounter();
        
        if (cartItemsContainer) {
            if (cartItems.length === 0) {
                cartItemsContainer.innerHTML = '<p>Your cart is empty. <a href="menu.html">Browse our menu</a> to add items.</p>';
                if (checkoutButton) checkoutButton.disabled = true;
                if (cartTotal) cartTotal.textContent = 'Total: 0 ₽';
                return;
            }
            
            let newContainer = document.createElement('div');
            newContainer.id = 'shopping-cart-items';
            let total = 0;

            for (const item of cartItems) {
                if (!item.id) continue;

                const itemDiv = document.createElement('div');
                itemDiv.className = 'shopping-cart-item';
                itemDiv.setAttribute('data-shopping-cart-item', item.id);
                
                const imageWrapper = document.createElement('div');
                imageWrapper.className = 'shopping-cart-item-image';
                
                const img = document.createElement('img');
                img.src = item.image || 'images/placeholder-food.jpg';
                img.alt = item.name || 'Food item';
                img.onerror = function() {
                    this.onerror = null;
                    this.src = 'images/placeholder-food.jpg';
                };
                
                imageWrapper.appendChild(img);
                
                const itemContent = `
                    <div class="shopping-cart-item-details">
                        <h3>${item.name || 'Unknown Item'}</h3>
                        <p class="item-price">Price: ${item.price || 'N/A'} ₽</p>
                    </div>
                    <div class="quantity-controls">
                        <button class="decrease-quantity" data-dish-id="${item.id}">-</button>
                        <span class="quantity" data-dish-id="${item.id}">${item.amount}</span>
                        <button class="increase-quantity" data-dish-id="${item.id}">+</button>
                    </div>
                    <p class="item-subtotal">Total: ${(item.price * item.amount).toFixed(0)} ₽</p>
                    <button class="remove-from-cart" data-dish-id="${item.id}">Remove</button>
                `;
                
                itemDiv.innerHTML = itemContent;
                itemDiv.insertBefore(imageWrapper, itemDiv.firstChild);
                newContainer.appendChild(itemDiv);

                total += item.price * item.amount;
            }

            if (cartTotal) {
                cartTotal.textContent = `Total: ${total.toFixed(0)} ₽`;
            }

            if (cartItemsContainer.parentNode) {
                cartItemsContainer.parentNode.replaceChild(newContainer, cartItemsContainer);
            }
            cartItemsContainer = newContainer;

            addCartEventListeners(newContainer);

            if (checkoutButton) {
                checkoutButton.disabled = false;
            }
        }
    } catch (error) {
        console.error('Failed to fetch cart items:', error);
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '<p>Error loading cart items. Please try again later.</p>';
        }
    }
}

function addCartEventListeners(container) {
    const increaseButtons = container.querySelectorAll('.increase-quantity');
    const decreaseButtons = container.querySelectorAll('.decrease-quantity');
    const removeButtons = container.querySelectorAll('.remove-from-cart');

    increaseButtons.forEach(button => {
        button.addEventListener('click', () => updateCartQuantity(button.dataset.dishId, true));
    });

    decreaseButtons.forEach(button => {
        button.addEventListener('click', () => updateCartQuantity(button.dataset.dishId, false));
    });

    removeButtons.forEach(button => {
        button.addEventListener('click', () => removeFromCart(button.dataset.dishId));
    });
}

async function updateCartQuantity(dishId, increase) {
    try {
        if (increase) {
            await apiRequest(`/api/basket/dish/${dishId}`, 'POST');
        } else {
            await apiRequest(`/api/basket/dish/${dishId}?increase=true`, 'DELETE');
        }
        await fetchCartItems();
        await updateCartCounter();
    } catch (error) {
        console.error('Error updating quantity:', error);
    }
}

async function addToCart(dishId) {
    try {
        await apiRequest(`/api/basket/dish/${dishId}`, 'POST');
        await loadCart();
        await updateCartCounter();
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

async function removeFromCart(dishId) {
    try {
        await apiRequest(`/api/basket/dish/${dishId}?increase=true`, 'DELETE');
        await loadCart();
        await updateCartCounter();
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
}

async function removeItemCompletely(dishId) {
    try {
        await apiRequest(`/api/basket/dish/${dishId}?increase=false`, 'DELETE');
        await loadCart();
        await updateCartCounter();
    } catch (error) {
        console.error('Error removing item from cart:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Cart page initialized');
    cartItemsContainer = document.getElementById('shopping-cart-items');
    checkoutButton = document.getElementById('checkout-btn');
    cartTotal = document.getElementById('cart-total');

    const token = localStorage.getItem('token');
    console.log('Retrieved token:', token);

    if (!token) {
        alert('You need to log in first.');
        window.location.href = 'login.html';
        return;
    }

    await loadCart();

    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            window.location.href = 'purchase.html';
        });
    } else {
        console.error('Checkout button not found');
    }
});

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.removeItemCompletely = removeItemCompletely;

export { fetchCartItems };