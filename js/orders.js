import { apiRequest } from './api.js';

async function loadOrders() {
    try {
        const ordersList = await apiRequest('/api/order', 'GET');
        console.log('Initial orders list:', ordersList);

        if (!ordersList || ordersList.length === 0) {
            displayEmptyOrders();
            return;
        }

        const ordersWithDetails = await Promise.all(
            ordersList.map(async (order) => {
                try {
                    const details = await apiRequest(`/api/order/${order.id}`, 'GET');
                    console.log(`Details for order ${order.id}:`, details);
                    return details;
                } catch (error) {
                    console.error(`Error fetching details for order ${order.id}:`, error);
                    return null;
                }
            })
        );

        const validOrders = ordersWithDetails
            .filter(order => order !== null)
            .sort((a, b) => {
                const dateA = new Date(a.orderTime).getTime();
                const dateB = new Date(b.orderTime).getTime();
                if (dateB > dateA) return 1;
                if (dateB < dateA) return -1;
                return 0;
            });

        console.log('Final orders with details (sorted):', validOrders);

        if (validOrders.length === 0) {
            displayEmptyOrders();
            return;
        }

        await renderOrders(validOrders);
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
            ? order.dishes.slice(0, 4).map(dish => `
                <div class="order-collage-item">
                    <img src="${dish.image || '../images/placeholder-food.jpg'}" 
                         alt="${dish.name}"
                         onerror="this.src='../images/placeholder-food.jpg'"
                         loading="lazy">
                </div>
            `).join('')
            : `<div class="order-collage-empty">
                <div class="order-summary">
                    ${order.status === 'Delivered' 
                        ? '<div class="order-completed">✓ Order Completed</div>'
                        : `<div class="order-status-text">${formatStatus(order.status)}</div>`
                    }
                </div>
               </div>`;

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