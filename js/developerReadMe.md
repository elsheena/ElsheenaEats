# Developer Documentation

1. Functions that need to be accessible from HTML must be added to window object:
   ```javascript
   // In menu.js, item.js, cart.js
   window.addToCart = async function(dishId) {
       await apiRequest(`/api/basket/dish/${dishId}`, 'POST');
       await updateCartCounter();
   }
   window.removeFromCart = removeFromCart;
   window.removeItemCompletely = removeItemCompletely;

   // In item.js
   window.setRating = async function(score) {
       await apiRequest(`/api/dish/${dishId}/rating?ratingScore=${score}`, 'POST');
   }

   // In order.js
   window.confirmDelivery = async function(orderId) {
       await apiRequest(`/api/order/${orderId}/status`, 'POST');
   }
   ```

2. API Communication:
   ```javascript
   const API_BASE_URL = 'https://food-delivery.int.kreosoft.space';
   
   export async function apiRequest(endpoint, method = 'GET', body = null) {
       const headers = {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${localStorage.getItem('token')}`
       };
       const response = await fetch(`${API_BASE_URL}${endpoint}`, {
           method,
           headers,
           body: body ? JSON.stringify(body) : null
       });
       if (!response.ok) {
           if (response.status === 401) {
               localStorage.removeItem('token');
               window.location.href = 'login.html';
           }
           throw new Error(`HTTP error! status: ${response.status}`);
       }
       return response.json();
   }
   ```

3. Cart Operations:
   ```javascript
   export async function getCart() {
       const response = await apiRequest('/api/basket', 'GET');
       return {
           dishes: response.map(item => ({
               id: item.id,
               name: item.name,
               price: item.price,
               amount: item.amount,
               image: item.image,
               totalPrice: item.totalPrice
           }))
       };
   }

   export async function updateCartCounter() {
       const cartData = await getCart();
       const cartCounter = document.getElementById('cart-counter');
       if (cartCounter && cartData.dishes) {
           const total = cartData.dishes.reduce((sum, item) => sum + item.amount, 0);
           cartCounter.textContent = total > 0 ? total : '';
           cartCounter.style.display = total > 0 ? 'inline-block' : 'none';
       }
   }
   ```

4. Authentication and User Management:
   ```javascript
   export async function login(email, password) {
       const data = await apiRequest('/api/account/login', 'POST', { email, password });
       localStorage.setItem('token', data.token);
       return data;
   }

   export async function register(userData) {
       const data = await apiRequest('/api/account/register', 'POST', userData);
       localStorage.setItem('token', data.token);
       return data;
   }

   export async function logout() {
       await apiRequest('/api/account/logout', 'POST');
       localStorage.removeItem('token');
       window.location.href = 'login.html';
   }
   ```

5. Order Management:
   ```javascript
   export async function getOrders() {
       return apiRequest('/api/order', 'GET');
   }

   export async function createOrder(orderData) {
       return apiRequest('/api/order', 'POST', orderData);
   }

   export async function getOrder(id) {
       return apiRequest(`/api/order/${id}`, 'GET');
   }
   ```

6. Menu and Dishes:
   ```javascript
   async function loadDishes() {
       const queryParams = new URLSearchParams();
       if (currentFilters.categories.size > 0) {
           currentFilters.categories.forEach(category => {
               queryParams.append('categories', category);
           });
       }
       queryParams.append('vegetarian', currentFilters.vegetarian);
       queryParams.append('sorting', currentFilters.sorting);
       queryParams.append('page', currentFilters.page);

       const response = await apiRequest(`/api/dish?${queryParams}`, 'GET');
       return response;
   }
   ```

7. Component Loading and Initialization:
   ```javascript
   document.addEventListener('DOMContentLoaded', async () => {
       await Promise.all([
           loadComponent('header-placeholder', 'header.html'),
           loadComponent('footer-placeholder', 'footer.html')
       ]);
       updateAuthUI();
       if (localStorage.getItem('token')) {
           await updateCartCounter();
       }
   });
   ```

8. The Most Important Rules:
   - Always check auth before protected operations
   - Update cart counter after cart modifications
   - Add functions to window if needed in HTML
   - Initialize after DOM loads
   - Handle API errors appropriately
   - Use async/await for API calls
   - Follow consistent error handling patterns
   - Keep token management centralized
   - Update UI based on authentication state
   - Validate data before API calls
