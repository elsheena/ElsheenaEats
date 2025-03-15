import { getCart, updateCartCounter, removeFromCart, addToCart, removeItemCompletely } from './api.js';
import { getCleanUrl, checkAuth } from './main.js';

let cartItemsContainer;
let checkoutButton;
let cartTotal;

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

export async function loadCart() {
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
                    <a href="${getCleanUrl('item', {id: item.id})}" class="shopping-cart-item-image">
                        <img src="${item.image || getRandomLoadingIcon()}" 
                             alt="${item.name}"
                             onerror="this.src='${getRandomLoadingIcon()}'">
                    </a>
                    <div class="shopping-cart-item-details">
                        <a href="${getCleanUrl('item', {id: item.id})}" class="shopping-cart-item-name">
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
                <a href="${getCleanUrl('index')}" class="btn btn-primary">Browse Menu</a>
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

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Cart page initialized');
    cartItemsContainer = document.getElementById('shopping-cart-items');
    checkoutButton = document.getElementById('checkout-btn');
    cartTotal = document.getElementById('cart-total');

    if (await checkAuth()) {
        await loadCart();

        if (checkoutButton) {
            checkoutButton.addEventListener('click', () => {
                window.location.href = getCleanUrl('purchase');
            });
        }
    }
});

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.removeItemCompletely = removeItemCompletely;

export { fetchCartItems };