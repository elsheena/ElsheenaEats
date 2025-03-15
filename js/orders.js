import { apiRequest } from './api.js';

async function loadOrders() {
    try {
        const orders = await apiRequest('/api/order', 'GET');
        console.log('Orders:', orders);

        if (!orders || orders.length === 0) {
            displayEmptyOrders();
            return;
        }

        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const orderDetails = await apiRequest(`/api/order/${order.id}`, 'GET');
                
                try {
                    const basketResponse = await apiRequest('/api/basket', 'GET');
                    console.log('Basket response for order:', order.id, basketResponse);
                    
                    if (basketResponse && Array.isArray(basketResponse)) {
                        orderDetails.dishes = basketResponse;
                    }
                } catch (basketError) {
                    console.error('Error fetching basket for order:', order.id, basketError);
                }

                return orderDetails;
            })
        );

        console.log('Orders with details:', ordersWithDetails);
        await renderOrders(ordersWithDetails);
    } catch (error) {
        console.error('Error loading orders:', error);
        displayEmptyOrders();
    }
}

function displayEmptyOrders() {
    const ordersContainer = document.getElementById('orders-list');
    ordersContainer.innerHTML = `
        <div class="orders-empty">
            <p>You haven't placed any orders yet</p>
            <a href="/" class="btn btn-primary">Start Ordering</a>
        </div>
    `;
}

async function renderOrders(orders) {
    const ordersContainer = document.getElementById('orders-list');
    ordersContainer.innerHTML = '';

    for (const order of orders) {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-card';
        
        const statusClass = getStatusClass(order.status);
        const formattedDeliveryTime = new Date(order.deliveryTime).toLocaleString();
        const formattedOrderTime = new Date(order.orderTime).toLocaleString();

        const dishImages = order.dishes && order.dishes.length > 0 
            ? order.dishes.slice(0, 4).map((dish, index) => `
                <div class="order-collage-item">
                    <img src="${dish.image}" 
                         alt="${dish.name}"
                         data-order-id="${order.id}"
                         data-dish-index="${index}"
                         data-all-dishes='${JSON.stringify(order.dishes.map(d => ({ 
                             image: d.image, 
                             name: d.name 
                         })))}'
                         loading="lazy">
                </div>
            `).join('')
            : `<div class="order-collage-empty">Order #${order.id.slice(0, 8)} - ${order.price} ₽</div>`;

        orderElement.innerHTML = `
            <a href="order.html?id=${order.id}" class="order-link">
                <div class="order-header">
                    <span class="order-number">Order #${order.id.slice(0, 8)}</span>
                    <span class="order-status ${statusClass}">${formatStatus(order.status)}</span>
                </div>
                
                <div class="order-collage">
                    ${dishImages}
                </div>

                <div class="order-info">
                    <span class="order-info-label">Order Time:</span>
                    <span>${formattedOrderTime}</span>
                    
                    <span class="order-info-label">Delivery Time:</span>
                    <span>${formattedDeliveryTime}</span>
                </div>

                <div class="order-total">
                    Total: ${order.price} ₽
                </div>
            </a>
        `;
        
        ordersContainer.appendChild(orderElement);

        const images = orderElement.getElementsByTagName('img');
        Array.from(images).forEach(img => {
            img.addEventListener('error', function() {
                const allDishes = JSON.parse(this.dataset.allDishes);
                const currentIndex = parseInt(this.dataset.dishIndex);
                
                const usedImages = new Set(Array.from(images)
                    .map(img => img.src)
                    .filter(src => !src.includes('placeholder-food.jpg')));
                
                const remainingDish = allDishes.slice(currentIndex + 1)
                    .find(dish => !usedImages.has(dish.image));

                if (remainingDish) {
                    this.src = remainingDish.image;
                    this.alt = remainingDish.name;
                } else {
                    const dishName = this.alt;
                    const container = this.parentElement;
                    container.innerHTML = `
                        <div class="order-collage-text">
                            ${dishName}
                        </div>
                    `;
                }
            });
        });
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'Delivered':
            return 'status-delivered';
        case 'InProcess':
            return 'status-in-process';
        case 'Cancelled':
            return 'status-cancelled';
        default:
            return '';
    }
}

function formatStatus(status) {
    switch (status) {
        case 'InProcess':
            return 'In Process';
        default:
            return status;
    }
}

async function confirmDelivery(orderId) {
    try {
        await apiRequest(`/api/order/${orderId}/status`, 'POST');
        await loadOrders();
    } catch (error) {
        console.error('Error confirming delivery:', error);
        alert('Failed to confirm delivery. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    await loadOrders();
});

window.confirmDelivery = confirmDelivery;