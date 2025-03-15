import { apiRequest, getOrder, confirmDelivery } from './api.js';
import { getCleanUrl, getRandomLoadingIcon } from './main.js';
// https://www.thymeleaf.org/doc/articles/standardurlsyntax.html

async function loadOrderDetails(orderId) {
    try {
        console.log('Loading order:', orderId);
        const orderDetails = await apiRequest(`/api/order/${orderId}`, 'GET');
        console.log('Order details:', orderDetails);
        
        if (!orderDetails) {
            displayError();
            return;
        }
        
        renderOrderDetails(orderDetails);
    } catch (error) {
        console.error('Error in loadOrderDetails:', error);
        if (error.message.includes('401')) {
            window.location.href = getCleanUrl('login');
        } else {
            displayError();
        }
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
                        <div class="order-item" onclick="window.location.href='item/${dish.id}'" style="cursor: pointer;">
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

document.addEventListener('DOMContentLoaded', async () => {
    const pathParts = window.location.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1];
    
    if (orderId === '' || orderId === 'index.html') {
        window.location.href = getCleanUrl('orders');
        return;
    }

    try {
        if (!await checkAuth()) {
            return;
        }
        await loadOrderDetails(orderId);
    } catch (error) {
        console.error('Error loading order:', error);
        displayError();
    }
});

window.confirmDelivery = confirmDelivery;