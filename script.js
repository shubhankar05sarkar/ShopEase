document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupCategoryListeners();
    loadCart();
});

function loadProducts(category = null) {
    console.log('Loading products for category:', category);
    const url = category 
        ? `/api/products?category=${encodeURIComponent(category)}`
        : '/api/products';
    
    console.log('Fetching from URL:', url);
    
    fetch(url)
        .then(response => response.json())
        .then(products => {
            console.log('Products received:', products);
            displayProducts(products);
        })
        .catch(error => {
            console.error('Error loading products:', error);
        });
}

function displayProducts(products) {
    console.log('Displaying products:', products);
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';

    if (products.length === 0) {
        productsContainer.innerHTML = '<p class="no-products">No products found in this category.</p>';
        return;
    }

    products.forEach(product => {
        console.log('Creating card for product:', product);
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        const priceInUSD = parseFloat(product.Price);
        
        const priceInINR = priceInUSD * 1;
        
        const productImage = product.Image_URL || 'https://picsum.photos/300/200';
        
        productCard.innerHTML = `
            <img src="${productImage}" alt="${product.Name}">
            <div class="product-info">
                <h3>${product.Name}</h3>
                <p>${product.Description || ''}</p>
                <p class="product-price">₹${priceInINR.toFixed(2)}</p>
                <button class="add-to-cart-btn" onclick="addToCart(${product.Product_ID})">
                    <i class="fas fa-shopping-cart"></i>
                    Add to Cart
                </button>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
}


function setupCategoryListeners() {
    console.log('Setting up category listeners');
    const categoryButtons = document.querySelectorAll('.category-card');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            console.log('Category clicked:', category);
            loadProducts(category);
        });
    });
}

function addToCart(productId) {
    const customerId = 1;
    
    fetch(`/api/cart/${customerId}/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId: productId,
            quantity: 1
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Product added to cart successfully!');
        loadCart();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error adding product to cart');
    });
}

function loadCart() {
    const customerId = 1;
    
    fetch(`/api/cart/${customerId}`)
        .then(response => response.json())
        .then(data => {
            console.log('Cart data:', data);
            displayCart(data.items);
        })
        .catch(error => {
            console.error('Error loading cart:', error);
        });
}

function displayCart(items) {
    console.log('Displaying cart items:', items);
    const cartSection = document.getElementById('cart');
    if (!cartSection) {
        console.error('Cart section not found in HTML');
        return;
    }

    let cartHTML = '<h2>Your Cart</h2>';
    
    if (!items || items.length === 0) {
        cartHTML += '<p class="empty-cart">Your cart is empty</p>';
    } else {
        cartHTML += `
            <div class="cart-items">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let cartTotal = 0;
        items.forEach(item => {
            const priceInUSD = parseFloat(item.Price);
            const priceInINR = priceInUSD * 1; 
            const itemTotalInINR = priceInINR * item.Quantity;
            cartTotal += itemTotalInINR;
            
            cartHTML += `
                <tr>
                    <td>${item.Name}</td>
                    <td>₹${priceInINR.toFixed(2)}</td>  <!-- Price in INR -->
                    <td>${item.Quantity}</td>
                    <td>₹${itemTotalInINR.toFixed(2)}</td>  <!-- Total in INR -->
                    <td>
                        <button onclick="removeFromCart(${item.Product_ID})">Remove</button>
                    </td>
                </tr>
            `;
        });

        cartHTML += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3"><strong>Total:</strong></td>
                            <td colspan="2"><strong>₹${cartTotal.toFixed(2)}</strong></td>  <!-- Total in INR -->
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    cartSection.innerHTML = cartHTML;
}


function removeFromCart(productId) {
    const customerId = 1;
    
    fetch(`/api/cart/${customerId}/items/${productId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Item removed from cart');
        loadCart();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error removing item from cart');
    });
}
