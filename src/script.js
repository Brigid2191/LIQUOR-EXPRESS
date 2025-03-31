document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const checkoutBtn = document.getElementById('checkout-btn');

    // API Base URL
    const API_BASE_URL = 'http://localhost:3000';

    // User Registration
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Basic validation
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            try {
                // Check if username already exists
                const usersResponse = await fetch(`${API_BASE_URL}/users?username=${username}`);
                const existingUsers = await usersResponse.json();

                if (existingUsers.length > 0) {
                    alert('Username already exists');
                    return;
                }

                // Create new user
                const response = await fetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fullName,
                        email,
                        username,
                        password
                    })
                });

                if (response.ok) {
                    alert('Registration Successful');
                    window.location.href = 'login.html';
                } else {
                    alert('Registration Failed');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during registration');
            }
        });
    }

    // User Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch(`${API_BASE_URL}/users?username=${username}&password=${password}`);
                const users = await response.json();

                if (users.length > 0) {
                    // Store logged-in user info in localStorage
                    localStorage.setItem('currentUser', JSON.stringify(users[0]));
                    alert('Login Successful');
                    window.location.href = 'drinkmenu.html';
                } else {
                    alert('Invalid Username or Password');
                }
            } catch (error) {
                console.error('Login Error:', error);
                alert('An error occurred during login');
            }
        });
    }

    // Load Drink Menu Dynamically
    async function loadDrinkMenu() {
        const drinkGrid = document.querySelector('.drink-grid');
        
        if (drinkGrid) {
            try {
                const response = await fetch(`${API_BASE_URL}/products`);
                const products = await response.json();

                drinkGrid.innerHTML = ''; // Clear existing items
                products.forEach(product => {
                    const drinkItem = document.createElement('div');
                    drinkItem.classList.add('drink-item');
                    drinkItem.innerHTML = `
                        <img src="${product.image}" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <p>$${product.price.toFixed(2)}</p>
                        <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
                    `;
                    drinkGrid.appendChild(drinkItem);
                });

                // Reinitialize cart buttons
                initializeCartButtons();
            } catch (error) {
                console.error('Error loading products:', error);
            }
        }
    }

    // Cart Functionality
    let cart = [];

    function initializeCartButtons() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const productId = button.dataset.id;
                
                try {
                    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
                    const product = await response.json();

                    cart.push(product);
                    updateCart();
                    
                    button.textContent = 'Added';
                    button.disabled = true;
                } catch (error) {
                    console.error('Error adding to cart:', error);
                }
            });
        });
    }

    function updateCart() {
        const cartItemsContainer = document.getElementById('cart-items');
        const totalPriceElement = document.getElementById('total-price');

        if (cartItemsContainer && totalPriceElement) {
            cartItemsContainer.innerHTML = '';
            const totalPrice = cart.reduce((total, item) => total + item.price, 0);

            cart.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.classList.add('cart-item');
                cartItemElement.innerHTML = `
                    <span>${item.name}</span>
                    <span>$${item.price.toFixed(2)}</span>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            });

            totalPriceElement.textContent = totalPrice.toFixed(2);
        }
    }

    // Checkout Functionality
    const checkoutButton = document.getElementById('checkout-btn');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', async () => {
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }

            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            if (!currentUser) {
                alert('Please login to place an order');
                window.location.href = 'login.html';
                return;
            }

            try {
                const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        products: cart,
                        total: cart.reduce((total, item) => total + item.price, 0),
                        date: new Date().toISOString()
                    })
                });

                if (orderResponse.ok) {
                    alert('Order placed successfully!');
                    cart = [];
                    updateCart();
                    document.querySelectorAll('.add-to-cart').forEach(btn => {
                        btn.textContent = 'Add to Cart';
                        btn.disabled = false;
                    });
                }
            } catch (error) {
                console.error('Checkout Error:', error);
                alert('Error placing order');
            }
        });
    }

    // Load drink menu on drink menu page
    loadDrinkMenu();
});