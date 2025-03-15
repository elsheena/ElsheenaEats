import { API_BASE_URL, apiRequest, getCart, updateCartCounter } from './api.js';

const API_ENDPOINTS = {
    dishes: '/api/dish',
    basket: '/api/basket',
    basketDish: (id) => `/api/basket/dish/${id}`
};

let currentFilters = {
    categories: new Set(),
    vegetarian: false,
    sorting: 'NameAsc',
    page: 1
};

const ITEMS_PER_PAGE = 12;
const CATEGORIES = ['Wok', 'Pizza', 'Soup', 'Dessert', 'Drink'];
const SORT_OPTIONS = {
    NameAsc: 'Name A-Z',
    NameDesc: 'Name Z-A',
    PriceAsc: 'Price Low to High',
    PriceDesc: 'Price High to Low',
    RatingAsc: 'Rating Low to High',
    RatingDesc: 'Rating High to Low'
};

document.addEventListener('DOMContentLoaded', async () => {
    await initializeFilters();
    await loadDishes();
    if (localStorage.getItem('token')) {
        await updateCartQuantities();
    }
});

function updateURLParameters() {
    const params = new URLSearchParams();
    
    if (currentFilters.categories.size > 0) {
        currentFilters.categories.forEach(category => {
            params.append('categories', category);
        });
    }
    
    params.set('vegetarian', currentFilters.vegetarian);
    params.set('sorting', currentFilters.sorting);
    
    if (currentFilters.page > 1) {
        params.set('page', currentFilters.page);
    }
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newURL);
}

function parseURLParameters() {
    const params = new URLSearchParams(window.location.search);
    
    currentFilters.categories = new Set(params.getAll('categories'));
    currentFilters.vegetarian = params.get('vegetarian') === 'true';
    currentFilters.sorting = params.get('sorting') || 'NameAsc';
    currentFilters.page = parseInt(params.get('page')) || 1;
}

async function initializeFilters() {
    parseURLParameters();
    
    const categoryContainer = document.querySelector('.categories');
    
    CATEGORIES.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = category;
        button.classList.toggle('active', currentFilters.categories.has(category));
        button.addEventListener('click', () => toggleCategory(category));
        categoryContainer.appendChild(button);
    });

    const vegetarianToggle = document.getElementById('vegetarian-toggle');
    if (vegetarianToggle) {
        vegetarianToggle.checked = currentFilters.vegetarian;
        vegetarianToggle.addEventListener('change', (e) => {
            currentFilters.vegetarian = e.target.checked;
            currentFilters.page = 1;
            updateURLParameters();
            loadDishes();
        });
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.innerHTML = '';
        
        Object.entries(SORT_OPTIONS).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            sortSelect.appendChild(option);
        });
        
        sortSelect.value = currentFilters.sorting;
        sortSelect.addEventListener('change', (e) => {
            currentFilters.sorting = e.target.value;
            currentFilters.page = 1;
            updateURLParameters();
            loadDishes();
        });
    }
}

function toggleCategory(category) {
    if (currentFilters.categories.has(category)) {
        currentFilters.categories.delete(category);
    } else {
        currentFilters.categories.add(category);
    }
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.textContent === category) {
            btn.classList.toggle('active');
        }
    });

    currentFilters.page = 1;
    updateURLParameters();
    loadDishes();
}

async function loadDishes() {
    try {
        const queryParams = new URLSearchParams();
        
        if (currentFilters.categories.size > 0) {
            currentFilters.categories.forEach(category => {
                queryParams.append('categories', category);
            });
        }
        
        queryParams.append('vegetarian', currentFilters.vegetarian);
        queryParams.append('sorting', currentFilters.sorting);
        queryParams.append('page', currentFilters.page);

        const response = await apiRequest(`${API_ENDPOINTS.dishes}?${queryParams}`, 'GET');
        await renderDishes(response.dishes);
        renderPagination(response.pagination.count);
    } catch (error) {
        console.error('Error loading dishes:', error);
    }
}

async function renderDishes(dishes) {
    const container = document.getElementById('dishes-container');
    if (!container) return;

    container.innerHTML = '';

    dishes.forEach(dish => {
        const dishElement = document.createElement('div');
        dishElement.className = 'dish-card';
        dishElement.dataset.id = dish.id;
        dishElement.innerHTML = `
            <div class="dish-image">
                <img src="${dish.image || 'images/placeholder.jpg'}" alt="${dish.name}">
            </div>
            <div class="dish-info">
                <div class="dish-header">
                    <h3 class="dish-name">${dish.name}</h3>
                    <span class="dish-price">${dish.price.toFixed(0)} ₽</span>
                </div>
                <p class="dish-description">${dish.description || ''}</p>
                <div class="dish-meta">
                    ${dish.vegetarian ? '<span class="vegetarian-badge">🌱 Vegetarian</span>' : ''}
                    <span class="rating">⭐ ${dish.rating ? dish.rating.toFixed(1) : 'N/A'}</span>
                </div>
                <div class="dish-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="removeFromCart('${dish.id}')">-</button>
                        <span class="quantity" data-dish-id="${dish.id}">0</span>
                        <button class="quantity-btn" onclick="addToCart('${dish.id}')">+</button>
                    </div>
                </div>
            </div>
        `;

        dishElement.addEventListener('click', (e) => {
            if (!e.target.closest('.quantity-controls')) {
                window.location.href = `item.html?id=${dish.id}`;
            }
        });

        container.appendChild(dishElement);
    });

    await updateCartQuantities();
}

function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (currentFilters.page > 1) {
        const prevLink = createPaginationLink(currentFilters.page - 1, '←');
        paginationContainer.appendChild(prevLink);
    }

    for (let i = 1; i <= totalPages; i++) {
        const pageLink = createPaginationLink(i);
        if (i === currentFilters.page) {
            pageLink.classList.add('active');
        }
        paginationContainer.appendChild(pageLink);
    }

    if (currentFilters.page < totalPages) {
        const nextLink = createPaginationLink(currentFilters.page + 1, '→');
        paginationContainer.appendChild(nextLink);
    }
}

function createPaginationLink(page, text = page) {
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = text;
    link.className = 'pagination-link';
    link.addEventListener('click', (e) => {
        e.preventDefault();
        currentFilters.page = page;
        updateURLParameters();
        loadDishes();
        window.scrollTo(0, 0);
    });
    return link;
}

async function updateCartQuantities() {
    try {
        const cartItems = await getCart();
        if (!cartItems || !cartItems.dishes) return;

        const quantityElements = document.querySelectorAll('.quantity');
        quantityElements.forEach(element => {
            const dishId = element.dataset.dishId;
            const cartItem = cartItems.dishes.find(item => item.id === dishId);
            element.textContent = cartItem ? cartItem.amount : '0';
        });
        
    } catch (error) {
        console.error('Error updating cart quantities:', error);
    }
}

window.addEventListener('popstate', () => {
    parseURLParameters();
    loadDishes();
});

async function addToCart(dishId) {
    try {
        await apiRequest(API_ENDPOINTS.basketDish(dishId), 'POST');
        await updateCartQuantities();
        await updateCartCounter();
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

async function removeFromCart(dishId) {
    try {
        await apiRequest(`/api/basket/dish/${dishId}?increase=true`, 'DELETE');
        await updateCartQuantities();
        await updateCartCounter();
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;