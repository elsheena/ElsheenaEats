import { getCart, createOrder, getProfile } from './api.js';
import { getCleanUrl } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = getCleanUrl('login');
        return;
    }

    try {
        const cartData = await getCart();
        console.log('Cart data:', cartData);

        if (!Array.isArray(cartData) || cartData.length === 0) {
            alert('Your cart is empty');
            window.location.href = getCleanUrl('cart');
            return;
        }

        const orderItemsContainer = document.getElementById('order-items');
        let total = 0;

        cartData.forEach(item => {
            total += item.totalPrice;
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            itemElement.innerHTML = `
                <div class="order-item-image">
                    <img src="${item.image || '../images/placeholder-food.jpg'}" alt="${item.name}">
                </div>
                <div class="order-item-details">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-price">${item.price} ₽ × ${item.amount}</div>
                </div>
                <div class="order-item-total">${item.totalPrice} ₽</div>
            `;
            orderItemsContainer.appendChild(itemElement);
        });

        document.getElementById('order-total').textContent = `${total.toFixed(0)} ₽`;

        const deliveryTimeInput = document.getElementById('deliveryTime');
        const minTime = new Date();
        minTime.setHours(minTime.getHours() + 1);
        const maxTime = new Date();
        maxTime.setDate(maxTime.getDate() + 7);

        deliveryTimeInput.min = minTime.toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', 'T');
        deliveryTimeInput.max = maxTime.toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', 'T');
        deliveryTimeInput.value = minTime.toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', 'T');

        const profile = await getProfile();
        
        if (profile) {
            const addressInput = document.getElementById('address');
            const phoneInput = document.getElementById('phone');

            if (addressInput && profile.address) {
                addressInput.value = profile.address;
            }

            if (phoneInput) {
                if (profile.phoneNumber) {
                    phoneInput.value = profile.phoneNumber;
                } else {
                    phoneInput.value = '+7';
                }

                phoneInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    
                    if (value) {
                        if (!value.startsWith('7')) {
                            value = '7' + value;
                        }
                        
                        if (value.length <= 11) {
                            value = value.replace(/(\d{1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/, function(match, p1, p2, p3, p4, p5) {
                                let parts = ['+' + p1];
                                if (p2) parts.push(' (' + p2 + ')');
                                if (p3) parts.push(' ' + p3);
                                if (p4) parts.push('-' + p4);
                                if (p5) parts.push('-' + p5);
                                return parts.join('');
                            });
                        }
                    }
                    
                    e.target.value = value;
                });
            }
        }

        const form = document.getElementById('order-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const deliveryTimeInput = document.getElementById('deliveryTime');
                const address = document.getElementById('address').value.trim();

                if (!address) {
                    alert('Please enter a delivery address');
                    return;
                }

                const localDeliveryTime = new Date(deliveryTimeInput.value);
                const utcDeliveryTime = new Date(localDeliveryTime.getTime() - localDeliveryTime.getTimezoneOffset() * 60000);
                const deliveryTime = utcDeliveryTime.toISOString();

                const minTime = new Date();
                minTime.setHours(minTime.getHours() + 1);
                const maxTime = new Date();
                maxTime.setDate(maxTime.getDate() + 7);

                if (deliveryTime < minTime) {
                    alert('Delivery time must be at least 1 hour from now');
                    return;
                }

                if (deliveryTime > maxTime) {
                    alert('Delivery time cannot be more than 7 days ahead');
                    return;
                }

                const orderData = {
                    deliveryTime: deliveryTime,
                    address: address
                };

                console.log('Sending order data:', orderData);

                const cartData = await getCart();
                if (!Array.isArray(cartData) || cartData.length === 0) {
                    alert('Your cart is empty');
                    window.location.href = getCleanUrl('cart');
                    return;
                }

                const response = await createOrder(orderData);
                console.log('Order response:', response);

                const cartCounter = document.getElementById('cart-counter');
                if (cartCounter) {
                    cartCounter.textContent = '';
                    cartCounter.style.display = 'none';
                }

                alert('Order placed successfully!');
                window.location.href = getCleanUrl('orders');
            } catch (error) {
                console.error('Error placing order:', error);
                if (error.message.includes('400')) {
                    alert('Invalid order data. Please check delivery time and address.');
                } else {
                    alert('Failed to place order. Please try again.');
                }
            }
        });

    } catch (error) {
        console.error('Error loading cart data:', error);
        alert('Error loading cart data. Please try again.');
    }
});