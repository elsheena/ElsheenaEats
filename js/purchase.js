import { apiRequest, getCart } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const cartData = await getCart();
        if (!cartData.dishes || cartData.dishes.length === 0) {
            alert('Your cart is empty');
            window.location.href = 'cart.html';
            return;
        }

        const orderItemsContainer = document.getElementById('order-items');
        let total = 0;

        cartData.dishes.forEach(item => {
            total += item.totalPrice;
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            itemElement.innerHTML = `
                <div class="order-item-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='../images/placeholder-food.jpg'">
                </div>
                <div class="order-item-details">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-price">${item.price} ₽ × ${item.amount}</div>
                </div>
                <div class="order-item-total">${item.totalPrice} ₽</div>
            `;
            orderItemsContainer.appendChild(itemElement);
        });

        document.getElementById('order-total').textContent = `${total} ₽`;

        const deliveryTimeInput = document.getElementById('deliveryTime');
        const minTime = new Date();
        minTime.setHours(minTime.getHours() + 1);
        deliveryTimeInput.min = minTime.toISOString().slice(0, 16);
        deliveryTimeInput.value = minTime.toISOString().slice(0, 16);

        const profile = await apiRequest('/api/account/profile', 'GET');
        if (profile && profile.address) {
            document.getElementById('address').value = profile.address;
        }
        if (profile && profile.phoneNumber) {
            document.getElementById('phone').value = profile.phoneNumber;
        }

    } catch (error) {
        console.error('Error loading cart data:', error);
        alert('Error loading cart data');
    }
});