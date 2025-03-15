# Project Structure Documentation

1. Root Files:
   - index.html: Main redirect page
   - README.md: Project overview
   - Task.docx: Project requirements

2. Core Directories:
   - /pages: All HTML pages
   - /js: JavaScript modules
   - /css: Stylesheets
   - /components: Reusable HTML components
   - /images: Static assets

3. Pages Structure:
   - index.html: Menu/dishes list
   - login.html: Authentication
   - register.html: User registration
   - cart.html: Shopping cart
   - item.html: Single dish view
   - order.html: Single order view
   - orders.html: Orders list
   - profile.html: User profile
   - purchase.html: Checkout

4. Components:
   - header.html: Navigation and cart counter
   - footer.html: Contact info and links

5. CSS Organization:
   - variables.css: Global CSS variables
   - styles.css: Common styles
   - Specific CSS files for each page (menu.css, cart.css, etc.)

6. JavaScript Modules:
   - api.js: API communication
   - main.js: Core initialization
   - Specific JS files matching HTML pages

7. Dependencies:
   - No external frameworks
   - Pure JavaScript/CSS/HTML
   - Server API integration only

8. The Most Important Rules:
   - Keep HTML pages in /pages
   - Match JS/CSS files to HTML pages
   - Reuse components from /components
   - Follow consistent naming
   - Keep related files together
   - Maintain separation of concerns
