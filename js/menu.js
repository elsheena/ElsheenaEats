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
    
    const resetButton = document.createElement('button');
    resetButton.className = 'reset-filters-btn btn-primary';
    resetButton.innerHTML = '🔄 Reset Filters';
    resetButton.addEventListener('click', resetFilters);
    
    const filtersWrapper = document.querySelector('.filter-row');
    if (filtersWrapper) {
        const rightGroup = filtersWrapper.querySelector('.right-group');
        if (rightGroup) {
            rightGroup.appendChild(resetButton);
        } else {
            const newRightGroup = document.createElement('div');
            newRightGroup.className = 'right-group';
            newRightGroup.appendChild(resetButton);
            filtersWrapper.appendChild(newRightGroup);
        }
    }
    
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

function resetFilters() {
    currentFilters.categories.clear();
    currentFilters.vegetarian = false;
    currentFilters.sorting = 'NameAsc';
    currentFilters.page = 1;
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('vegetarian-toggle').checked = false;
    document.getElementById('sort-select').value = 'NameAsc';
    
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
        const container = document.getElementById('dishes-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-dishes-message">
                    <div class="no-dishes-content">
                        <h3>🤔 Oops! Something went wrong</h3>
                        <p>We couldn't find any dishes with your current filters. 🍽️</p>
                        <p>Our chefs are probably cooking up something delicious! 👨‍🍳✨</p>
                        <p>Try <button onclick="resetFilters()" class="reset-link">resetting the filters</button> or check back later!</p>
                    </div>
                </div>
            `;
            const paginationElement = document.getElementById('pagination');
            if (paginationElement) {
                paginationElement.style.display = 'none';
            }
        }
    }
}

async function renderDishes(dishes) {
    const container = document.getElementById('dishes-container');
    const paginationElement = document.getElementById('pagination');
    if (!container) return;

    container.innerHTML = '';

    if (!dishes || dishes.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-dishes-message';
        emptyMessage.innerHTML = `
            <div class="no-dishes-content">
                <h3>🔍 No dishes found</h3>
                <p>We couldn't find any dishes matching your filters right now. 🍽️</p>
                <p>Our chefs are working on adding more delicious options! 👨‍🍳✨</p>
                <p>You can try:</p>
                <ul style="text-align: left; margin: 10px 0;">
                    <li>Removing some category filters</li>
                    <li>Unchecking the vegetarian option</li>
                    <li><button onclick="resetFilters()" class="reset-link">Reset all filters</button></li>
                </ul>
            </div>
        `;
        container.appendChild(emptyMessage);
        if (paginationElement) {
            paginationElement.style.display = 'none';
        }
        return;
    }

    if (paginationElement) {
        paginationElement.style.display = 'flex';
    }

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
                    <span class="rating" title="Dish rating">${formatRating(dish.rating)}</span>
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
                e.preventDefault();
                const url = `item.html?id=${dish.id}`;
                window.location.href = url;
            }
        });

        container.appendChild(dishElement);
    });

    await updateQuantityDisplay();
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
        await apiRequest(`/api/basket/dish/${dishId}`, 'POST');
        await updateQuantityDisplay();
        await updateCartCounter();
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

async function removeFromCart(dishId) {
    try {
        await apiRequest(`/api/basket/dish/${dishId}?increase=true`, 'DELETE');
        await updateQuantityDisplay();
        await updateCartCounter();
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.resetFilters = resetFilters;

function formatRating(rating) {
    if (rating === null || rating === undefined) {
        return '⭐ No ratings yet';
    }
    const ratingNum = parseFloat(rating);
    if (!Number.isFinite(ratingNum)) {
        return '⭐ No ratings yet';
    }
    return `⭐ ${ratingNum.toFixed(1)}/10`;
}

async function updateQuantityDisplay() {
    try {
        const cartData = await getCart();
        if (!Array.isArray(cartData)) return;

        document.querySelectorAll('.quantity').forEach(element => {
            element.textContent = '0';
        });

        cartData.forEach(item => {
            const quantityElements = document.querySelectorAll(`.quantity[data-dish-id="${item.id}"]`);
            quantityElements.forEach(element => {
                element.textContent = item.amount.toString();
            });
        });
    } catch (error) {
        console.error('Error updating quantities:', error);
    }
}

export async function updateAllQuantities() {
    await updateQuantityDisplay();
    await updateCartCounter();
}