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
                        <img src="${getErrorLoadingIcon()}" 
                             alt="Loading" 
                             class="error-loading-icon">
                        ${(() => {
                            const message = getNoResultsMessage();
                            return `
                                <h3>${message.title}</h3>
                                <p>${message.subtitle}</p>
                                <p>${message.action}</p>
                            `;
                        })()}
                        <p>Meanwhile, you can try <button onclick="resetFilters()" class="reset-link">resetting the filters</button> or check back later! 🔄</p>
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
                <h3>🔍 👨‍🍳 Nothing on the menu yet!</h3>
                <p>We couldn't find any dishes matching your filters right now. 🍽️</p>
                <p>Our master chefs are preparing something special! 👨‍🍳✨</p>
                <p>You can try:</p>
                <ul style="text-align: left; margin: 10px 0;">
                    <li>Removing some filters 🔄</li>
                    <li>Checking different categories 📋</li>
                    <li>Coming back later for fresh dishes! 🍳</li>
                </ul>
                <button onclick="resetFilters()" class="btn btn-primary">Reset All Filters</button>
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
                <img src="${dish.image || getRandomLoadingIcon()}" 
                     alt="${dish.name}"
                     onerror="this.src='${getRandomLoadingIcon()}'">
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
    
    // Convert 10-point scale to 5 stars (divide by 2)
    const starCount = ratingNum / 2;
    const fullStars = Math.floor(starCount);
    const hasHalfStar = starCount % 1 >= 0.5;
    
    return '⭐'.repeat(fullStars) + 
           (hasHalfStar ? '⭐' : '') + 
           '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0)) +
           ` ${ratingNum.toFixed(1)}/10`;
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
        '../images/loading-searching.svg',
        '../images/loading-cooking.svg',
        '../images/loading-plating.svg',
        '../images/loading-menu.svg'
    ];
    return icons[Math.floor(Math.random() * icons.length)];
}

function getErrorLoadingIcon() {
    const memeIcons = [
        '../images/loading-meme.svg',
        '../images/loading-nothing.svg',
        '../images/loading-confused-chef.svg',
        '../images/loading-cooking-fail.svg',
        '../images/loading-searching.svg',
        '../images/loading-cooking.svg',
        '../images/loading-plating.svg',
        '../images/loading-menu.svg'
    ];
    return memeIcons[Math.floor(Math.random() * memeIcons.length)];
}

function getNoResultsMessage() {
    const messages = [
        {
            title: "🤔 👨‍🍳 Our chef is having a creative block!",
            subtitle: "We searched high and low in our kitchen, but couldn't find what you're looking for. 🔍",
            action: "Maybe it's time to try something new? Our chef is full of surprises! ✨"
        },
        {
            title: "👨‍🍳 Oops! The dishes are playing hide and seek!",
            subtitle: "They're really good at hiding from these filters! 🙈",
            action: "Let's catch them with different filters! 🎯"
        },
        {
            title: "🏃‍♂️ 👨‍🍳 Our dishes went on vacation!",
            subtitle: "Even food needs a break sometimes! 🌴",
            action: "But don't worry, they'll be back soon with new friends! 🌟"
        },
        {
            title: "👨‍🍳 ⚡ Plot twist: No dishes matched!",
            subtitle: "This is like finding a vegetarian at a BBQ contest! 😅",
            action: "Time for Plan B: Let's explore other delicious options! 🍽️"
        },
        {
            title: "🎭 👨‍🍳 The Great Food Mystery!",
            subtitle: "The case of the disappearing dishes... 🕵️‍♂️",
            action: "Shall we look for clues in other categories? 🔍"
        }
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}