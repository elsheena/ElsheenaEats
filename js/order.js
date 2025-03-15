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
        console.log('Using token:', token);

        const orderDetails = await apiRequest(`/api/order/${orderId}`, 'GET');
        console.log('Raw API response:', orderDetails);

        try {
            const basketResponse = await apiRequest('/api/basket', 'GET');
            console.log('Basket response:', basketResponse);
            
            if (basketResponse && Array.isArray(basketResponse)) {
                orderDetails.dishes = basketResponse;
            }
        } catch (basketError) {
            console.error('Error fetching basket:', basketError);
        }

        console.log('Final order details:', orderDetails);
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

    console.log('Full order object:', order);
    console.log('Dishes array:', order.dishes);

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

            <div class="order-items">
                ${Array.isArray(order.dishes) && order.dishes.length > 0 ? 
                    order.dishes.map(dish => `
                        <div class="order-item" onclick="window.location.href='item.html?id=${dish.id}'">
                            <div class="order-item-image">
                                <img src="${dish.image || '../images/placeholder-food.jpg'}" 
                                     alt="${dish.name}"
                                     onerror="this.src='../images/placeholder-food.jpg'"
                                     loading="lazy">
                            </div>
                            <div class="order-item-details">
                                <h4>${dish.name || 'Unknown Item'}</h4>
                                <span class="order-item-price">${dish.price || 0} ₽ × ${dish.amount || 1}</span>
                            </div>
                            <span class="order-item-total">${dish.totalPrice || (dish.price * dish.amount) || 0} ₽</span>
                        </div>
                    `).join('') 
                    : `
                        <div class="orders-empty">
                            <p>This order contains ${order.price ? `items worth ${order.price} ₽` : 'no items'}</p>
                        </div>
                    `
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
        await loadOrderDetails(); // Refresh the order details
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