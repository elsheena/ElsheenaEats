# Designer Documentation

1. CSS Variables (in variables.css):
   - Colors:
     - Primary: #FF6B6B
     - Secondary: #4ECDC4
     - Accent: #FFE66D
     - Success: #2ECC71
     - Warning: #F1C40F
     - Error: #E74C3C
     - Text colors: #2C3E50, #7F8C8D
     - Background colors: #FFFFFF, #F8F9FA, #E9ECEF

   - Spacing:
     - xs: 4px
     - sm: 8px
     - md: 16px
     - lg: 24px
     - xl: 32px

   - Border Radius:
     - sm: 4px
     - md: 8px
     - lg: 12px

   - Font:
     - Family: 'Inter', system fonts
     - Sizes: 12px, 14px, 16px, 18px, 24px
     - Weights: 400, 500, 700

2. Layout Constants:
   - Container width: 1200px
   - Header height: 64px
   - Footer height: 60px

3. Component Styles:
   - Cards: box-shadow, border-radius
   - Buttons: hover states, transitions
   - Forms: consistent input styling
   - Navigation: fixed header, z-index

4. Responsive Breakpoints:
   - Mobile: max-width: 768px
   - Adjust grid layouts
   - Stack elements vertically
   - Reduce padding/margins

5. Common Classes:
   - .container: max-width with auto margins
   - .btn: base button styles
   - .card: shadow and padding
   - .nav-link: navigation styling
   - .auth-required: authentication visibility

6. Animation/Transitions:
   - Fast: 150ms ease
   - Normal: 250ms ease
   - Slow: 350ms ease

7. Status Colors:
   - Success: green background
   - Error: red background
   - Warning: yellow background
   - Disabled: gray background

8. Z-index Layers:
   - Dropdown: 1000
   - Sticky: 1020
   - Fixed: 1030
   - Modal: 1040
   - Popover: 1050
   - Tooltip: 1060

9. The Most Important Rules:
   - Use CSS variables for consistency
   - Follow responsive design patterns
   - Maintain consistent spacing
   - Handle hover/active states
   - Consider accessibility
   - Test on different screen sizes
