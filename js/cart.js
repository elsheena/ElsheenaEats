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

function getRandomLoadingIcon() {
    const icons = [
        '../images/loading-plate.svg',
        '../images/loading-chef.svg',
        '../images/loading-nothing.svg',
        '../images/loading-icon.svg',
        '../images/loading-meme.svg',
        '../images/loading-cooking.svg',
        '../images/loading-plating.svg',
        '../images/loading-menu.svg',
        '../images/loading-nothing.svg',
        '../images/loading-icon.svg',
        '../images/loading-meme.svg',
        '../images/loading-cooking.svg',
        '../images/loading-plating.svg',
        '../images/loading-menu.svg'

    ];
    return icons[Math.floor(Math.random() * icons.length)];
}

async function loadCart() {
    try {
        const cartData = await getCart();
        console.log('Cart data:', cartData);

        if (!Array.isArray(cartData) || cartData.length === 0) {
            showEmptyCartMessage();
            return;
        }

        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            let total = 0;

            cartData.forEach(item => {
                total += item.totalPrice;
                const itemElement = document.createElement('div');
                itemElement.className = 'shopping-cart-item';
                itemElement.innerHTML = `
                    <a href="item.html?id=${item.id}" class="shopping-cart-item-image">
                        <img src="${item.image || getRandomLoadingIcon()}" 
                             alt="${item.name}"
                             onerror="this.src='${getRandomLoadingIcon()}'">
                    </a>
                    <div class="shopping-cart-item-details">
                        <a href="item.html?id=${item.id}" class="shopping-cart-item-name">
                            <h3>${item.name}</h3>
                        </a>
                        <p class="shopping-cart-item-price">${item.price} ₽</p>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="removeFromCart('${item.id}')">-</button>
                        <span class="quantity" data-dish-id="${item.id}">${item.amount}</span>
                        <button class="quantity-btn" onclick="addToCart('${item.id}')">+</button>
                    </div>
                    <button class="remove-item" onclick="removeItemCompletely('${item.id}')">
                        🗑️ Remove
                    </button>
                `;
                cartItemsContainer.appendChild(itemElement);
            });

            if (cartTotal) {
                cartTotal.textContent = `${total.toFixed(0)} ₽`;
            }

            if (checkoutButton) {
                checkoutButton.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        showErrorMessage('Failed to load cart. Please try again.');
    }
}

function showEmptyCartMessage() {
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = `
            <div class="shopping-cart-empty">
                <h2>Your cart is empty</h2>
                <p>Add some delicious dishes to get started! 🍽️</p>
                <a href="index.html" class="btn btn-primary">Browse Menu</a>
            </div>
        `;
    }
    if (cartTotal) {
        cartTotal.textContent = '0 ₽';
    }
    if (checkoutButton) {
        checkoutButton.style.display = 'none';
    }
}

function showErrorMessage(message) {
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = `
            <div class="shopping-cart-empty">
                <h2>Oops!</h2>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Try Again</button>
            </div>
        `;
    }
}

function renderCartItems(cartData) {
    const container = document.getElementById('cart-items');
    if (!container) return;

    container.innerHTML = '';

    cartData.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'shopping-cart-item';
        itemElement.dataset.id = item.id;
        
        itemElement.innerHTML = `
            <div class="shopping-cart-item-image">
                <img src="${item.image || '../images/placeholder-food.jpg'}" alt="${item.name}">
            </div>
            <div class="shopping-cart-item-details">
                <h3>${item.name}</h3>
                <div class="shopping-cart-item-price">${item.price} ₽</div>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn decrease-btn" data-id="${item.id}">-</button>
                <span class="quantity">${item.amount}</span>
                <button class="quantity-btn increase-btn" data-id="${item.id}">+</button>
            </div>
            <button class="remove-item-completely" data-id="${item.id}">Remove</button>
        `;

        itemElement.addEventListener('click', (e) => {
            if (!e.target.closest('.quantity-controls') && !e.target.closest('.remove-item-completely')) {
                window.location.href = `item.html?id=${item.id}`;
            }
        });

        container.appendChild(itemElement);
    });

    addCartControlListeners();
}

function addCartControlListeners() {
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.remove-item-completely').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });

    document.querySelectorAll('.increase-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            await addToCart(id);
            await updateCart();
        });
    });

    document.querySelectorAll('.decrease-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            await removeFromCart(id);
            await updateCart();
        });
    });

    document.querySelectorAll('.remove-item-completely').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            await removeItemCompletely(id);
            await updateCart();
        });
    });
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
    container.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const dishId = button.dataset.dishId;
        if (!dishId) return;

        try {
            if (button.classList.contains('decrease')) {
                await removeFromCart(dishId);
            } else if (button.classList.contains('increase')) {
                await addToCart(dishId);
            } else if (button.classList.contains('remove-item')) {
                await removeItemCompletely(dishId);
            }
            await loadCart();
        } catch (error) {
            console.error('Error updating cart:', error);
            alert('Failed to update cart. Please try again.');
        }
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
    }
});

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.removeItemCompletely = removeItemCompletely;

export { fetchCartItems };