const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

// Serve login.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve main page only if authenticated
app.get('/main', (req, res) => {
    // Check if user is authenticated
    const user = req.headers['user-agent'];
    if (!user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        // Prevent direct access to index.html
        if (path.endsWith('index.html')) {
            res.set('Cache-Control', 'no-store');
        }
    }
}));

// database connection with promise wrapper (add your database info here)
const db = mysql.createConnection({
    host: 'YOUR_DB_HOST',
    user: 'YOUR_DB_USER',
    password: 'YOUR_DB_PASSWORD',
    database: 'YOUR_DB_NAME'
}).promise();

async function initializeDatabase() {
    try {
        await db.connect();
        console.log('Connected to MySQL database');

        // create database if it doesn't exist
        await db.query('CREATE DATABASE IF NOT EXISTS ecommerceplatform_v2');
        await db.query('USE ecommerceplatform_v2');

        // check if users table exists
        const [tables] = await db.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'ecommerceplatform_v2' 
            AND table_name = 'users'
        `);

        if (tables[0].count === 0) {
            console.log('Creating users table...');
            await db.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Users table created successfully');
        } else {
            console.log('Users table already exists');
        }
    } catch (err) {
        console.error('Database initialization error:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            sqlMessage: err.sqlMessage
        });
        process.exit(1); // Exit if we can't connect to database
    }
}

initializeDatabase();

async function clearEmptyCart(cartId) {
    try {
        const [results] = await db.query(
            'SELECT COUNT(*) as itemCount FROM cart_items WHERE Cart_ID = ? FOR UPDATE',
            [cartId]
        );
        
        if (results[0].itemCount === 0) {
            await db.query('DELETE FROM cart WHERE Cart_ID = ?', [cartId]);
            console.log('Empty cart deleted:', cartId);
        }
    } catch (err) {
        console.error('Error in clearEmptyCart:', err);
    }
}

app.get('/api/products', async (req, res) => {
    try {
        const category = req.query.category;
        console.log('Category requested:', category);

        let query = `
            SELECT p.*, c.Name as category_name 
            FROM product p 
            JOIN category c ON p.Category_ID = c.Category_ID
        `;
        
        if (category) {
            query += ' WHERE c.Name = ?';
            console.log('Executing query with category:', category);
            const [results] = await db.query(query, [category]);
            console.log('Query results:', results);
            res.json(results);
        } else {
            console.log('Executing query for all products');
            const [results] = await db.query(query);
            console.log('All products results:', results);
            res.json(results);
        }
    } catch (err) {
        console.error('Error in /api/products:', err);
        res.status(500).json({ error: 'Error fetching products' });
    }
});

// Get cart for customer
app.get('/api/cart/:customerId', async (req, res) => {
    try {
        const customerId = req.params.customerId;
        console.log('Fetching cart for customer:', customerId);

        // Start transaction
        await db.beginTransaction();

        // Get or create cart with row-level locking
        const [cartResults] = await db.query(
            'SELECT Cart_ID FROM cart WHERE Customer_ID = ? FOR UPDATE',
            [customerId]
        );

        let cartId;
        if (cartResults.length === 0) {
            // Create new cart
            const [result] = await db.query(
                'INSERT INTO cart (Customer_ID) VALUES (?)',
                [customerId]
            );
            cartId = result.insertId;
        } else {
            cartId = cartResults[0].Cart_ID;
        }

        // Get cart items with product details
        const [items] = await db.query(`
            SELECT ci.*, p.Name, p.Price 
            FROM cart_items ci 
            JOIN product p ON ci.Product_ID = p.Product_ID 
            WHERE ci.Cart_ID = ?
        `, [cartId]);

        await db.commit();
        console.log('Cart items found:', items);
        res.json({ cartId, items });
    } catch (err) {
        await db.rollback();
        console.error('Error in /api/cart/:customerId:', err);
        res.status(500).json({ error: 'Error fetching cart' });
    }
});

// Add item to cart
app.post('/api/cart/:customerId/items', async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const { productId, quantity } = req.body;
        console.log('Adding item to cart:', { customerId, productId, quantity });

        // Start transaction
        await db.beginTransaction();

        // Get or create cart with row-level locking
        const [cartResults] = await db.query(
            'SELECT Cart_ID FROM cart WHERE Customer_ID = ? FOR UPDATE',
            [customerId]
        );

        let cartId;
        if (cartResults.length === 0) {
            // Create new cart
            const [result] = await db.query(
                'INSERT INTO cart (Customer_ID) VALUES (?)',
                [customerId]
            );
            cartId = result.insertId;
        } else {
            cartId = cartResults[0].Cart_ID;
        }

        // Check if item exists in cart with row-level locking
        const [existingItems] = await db.query(
            'SELECT * FROM cart_items WHERE Cart_ID = ? AND Product_ID = ? FOR UPDATE',
            [cartId, productId]
        );

        if (existingItems.length > 0) {
            // Update quantity
            const newQuantity = existingItems[0].Quantity + quantity;
            await db.query(
                'UPDATE cart_items SET Quantity = ? WHERE Cart_ID = ? AND Product_ID = ?',
                [newQuantity, cartId, productId]
            );
        } else {
            // Add new item
            await db.query(
                'INSERT INTO cart_items (Cart_ID, Product_ID, Quantity) VALUES (?, ?, ?)',
                [cartId, productId, quantity]
            );
        }

        await db.commit();
        res.json({ message: 'Cart updated successfully' });
    } catch (err) {
        await db.rollback();
        console.error('Error in /api/cart/:customerId/items:', err);
        res.status(500).json({ error: 'Error updating cart' });
    }
});

// Remove item from cart
app.delete('/api/cart/:customerId/items/:productId', async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const productId = req.params.productId;
        console.log('Removing item from cart:', { customerId, productId });

        // Start transaction
        await db.beginTransaction();

        // Get cart with row-level locking
        const [cartResults] = await db.query(
            'SELECT Cart_ID FROM cart WHERE Customer_ID = ? FOR UPDATE',
            [customerId]
        );

        if (cartResults.length === 0) {
            await db.rollback();
            res.status(404).json({ error: 'Cart not found' });
            return;
        }

        const cartId = cartResults[0].Cart_ID;

        // Remove item with row-level locking
        await db.query(
            'DELETE FROM cart_items WHERE Cart_ID = ? AND Product_ID = ?',
            [cartId, productId]
        );

        await clearEmptyCart(cartId);

        await db.commit();
        res.json({ message: 'Item removed from cart successfully' });
    } catch (err) {
        await db.rollback();
        console.error('Error in /api/cart/:customerId/items/:productId:', err);
        res.status(500).json({ error: 'Error removing item from cart' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Check if user already exists
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create new user
        const [result] = await db.query(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, password, 'user']
        );

        res.status(201).json({ 
            message: 'User created successfully',
            userId: result.insertId 
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = users[0];
        res.json({ 
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error during login' });
    }
});

app.get('/api/auth/check', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(401).json({ authenticated: false });
        }

        const [users] = await db.query(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ authenticated: false });
        }

        res.json({ 
            authenticated: true,
            user: {
                id: users[0].id,
                username: users[0].username,
                role: users[0].role
            }
        });
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(500).json({ error: 'Error checking authentication' });
    }
});

app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
}); 
