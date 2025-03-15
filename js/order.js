import { apiRequest } from './api.js';

async function loadOrderDetails() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('id');
        
        if (!orderId) {
            throw new Error('No order ID provided');
        }

        console.log('Loading order:', orderId);
        const orderDetails = await apiRequest(`/api/order/${orderId}`, 'GET');
        console.log('Order details:', orderDetails);
        
        renderOrderDetails(orderDetails);
    } catch (error) {
        console.error('Error in loadOrderDetails:', error);
        if (error.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        displayError();
    }
}

function renderOrderDetails(order) {
    const container = document.getElementById('order-details');
    const statusClass = getStatusClass(order.status);
    const formattedDeliveryTime = new Date(order.deliveryTime).toLocaleString();
    const formattedOrderTime = new Date(order.orderTime).toLocaleString();

    container.innerHTML = `
        <div class="order-card">
            <div class="order-header">
                <span class="order-number">Order #${order.id.slice(0, 8)}</span>
                <span class="order-status ${statusClass}">${formatStatus(order.status)}</span>
            </div>
            
            <div class="order-info">
                <span class="order-info-label">Order Time:</span>
                <span>${formattedOrderTime}</span>
                
                <span class="order-info-label">Delivery Time:</span>
                <span>${formattedDeliveryTime}</span>
                
                <span class="order-info-label">Delivery Address:</span>
                <span>${order.address}</span>
            </div>

            ${order.status === 'Delivered' ? `
                <div class="order-completed-message">
                    <div class="completed-icon">✓</div>
                    <div class="completed-text">
                        <h3>Order Completed</h3>
                        <p>Delivered on ${formattedDeliveryTime}</p>
                    </div>
                </div>
            ` : ''}

            <div class="order-items">
                ${order.dishes && order.dishes.length > 0 ? 
                    order.dishes.map(dish => `
                        <div class="order-item" onclick="window.location.href='item.html?id=${dish.id}'" style="cursor: pointer;">
                            <div class="order-item-image">
                                <img src="${dish.image || getRandomLoadingIcon()}" 
                                     alt="${dish.name}"
                                     onerror="this.src='${getRandomLoadingIcon()}'">
                            </div>
                            <div class="order-item-details">
                                <h4>${dish.name}</h4>
                                <span class="order-item-price">${dish.price} ₽ × ${dish.amount}</span>
                            </div>
                            <span class="order-item-total">${dish.totalPrice} ₽</span>
                        </div>
                    `).join('') 
                    : '<div class="orders-empty">No items in this order</div>'
                }
            </div>

            <div class="order-total">
                Total: ${order.price} ₽
            </div>

            ${order.status === 'InProcess' ? `
                <button class="confirm-delivery-btn" onclick="confirmDelivery('${order.id}')">
                    ✓ Confirm Delivery
                </button>
            ` : ''}
        </div>
    `;
}

function displayError() {
    const container = document.getElementById('order-details');
    container.innerHTML = `
        <div class="orders-empty">
            <p>Order not found or an error occurred</p>
            <a href="orders.html" class="btn btn-primary">Back to Orders</a>
        </div>
    `;
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
        await loadOrderDetails(); 
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
    await loadOrderDetails();
});

window.confirmDelivery = confirmDelivery;

function getRandomLoadingIcon() {
    const icons = [
        '../images/loading-plate.svg',
        '../images/loading-chef.svg',
        '../images/loading-cooking.svg',
        '../images/loading-plating.svg',
        '../images/loading-menu.svg',
        '../images/loading-nothing.svg',
        '../images/loading-icon.svg',
        '../images/loading-meme.svg',
        '../images/loading-confused-chef.svg',
        '../images/loading-cooking-fail.svg',
        '../images/loading-searching.svg'
    ];
    return icons[Math.floor(Math.random() * icons.length)];
}