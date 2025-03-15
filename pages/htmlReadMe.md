# HTML Documentation

1. Page Structure:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>[Page Name] - ElsheenaEats</title>
       <link rel="stylesheet" href="../css/styles.css">
       <link rel="stylesheet" href="../css/[page-specific].css">
   </head>
   <body>
       <div id="header-placeholder"></div>
       <main class="container">
           <!-- Page content -->
       </main>
       <div id="footer-placeholder"></div>
       <script type="module" src="../js/main.js"></script>
       <script type="module" src="../js/[page-specific].js"></script>
   </body>
   </html>
   ```

2. Common Components:
   - Header placeholder: `<div id="header-placeholder"></div>`
   - Footer placeholder: `<div id="footer-placeholder"></div>`
   - Main content wrapper: `<main class="container">`

3. Authentication Elements:
   - Auth-required class: `class="auth-required"`
   - Auth-hide class: `class="auth-hide"`
   - Login/register forms: `<form id="login-form">`

4. Data Attributes:
   - Dish IDs: `data-dish-id="[id]"`
   - Cart items: `data-shopping-cart-item="[id]"`
   - Quantity controls: `data-quantity="[amount]"`

5. Form Patterns:
   ```html
   <form id="[form-name]">
       <div class="form-group">
           <label for="[input-id]">[Label]</label>
           <input type="[type]" id="[input-id]" name="[name]" required>
       </div>
   </form>
   ```

6. Button Patterns:
   ```html
   <button class="btn btn-primary" onclick="[function]([params])">
   <button class="quantity-btn" onclick="[function]([params])">
   ```

7. List/Grid Patterns:
   - Dishes grid: `<div class="dishes-grid">`
   - Orders list: `<div class="orders-list">`
   - Cart items: `<div class="shopping-cart-items">`

8. Image Handling:
   ```html
   <img src="[path]" 
        alt="[description]" 
        onerror="this.src='../images/placeholder.jpg'"
        loading="lazy">
   ```

9. The Most Important Rules:
   - Use semantic HTML elements
   - Include proper meta tags
   - Add language attribute
   - Use descriptive IDs and classes
   - Maintain consistent component structure
   - Include alt text for images
   - Use data attributes for JS hooks
   - Keep scripts at bottom of body
   - Use type="module" for JS imports
   - Follow component-based structure 