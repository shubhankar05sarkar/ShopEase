# ShopEase

**A Modern Full-Stack E-Commerce Platform**

ShopEase is a full-stack e-commerce web application designed to deliver a seamless online shopping experience. Built using **Node.js**, **Express**, **MySQL**, and **Vanilla JavaScript**, it offers features like secure user authentication, product browsing, and cart management. With its clean, responsive user interface, ShopEase is perfect for learning, prototyping, or serving as a foundation for advanced e-commerce projects.

---

## **Features**

* **User Authentication**: Sign up and log in securely.
* **Product Browsing**: Explore products by categories like Clothing and Electronics.
* **Cart Management**: Add, view, and remove items from your shopping cart.
* **Responsive Design**: Optimized for desktops, tablets, and mobile devices.
* **Modern UI**: Clean, intuitive design for enhanced user experience.

---

## **Technologies Used**

* **Frontend**: HTML, CSS, JavaScript
* **Backend**: Node.js, Express
* **Database**: MySQL

---

## **Project Structure**

```
shopease/
├── create_users_table.sql       # SQL for creating the users table
├── index.html                   # Main UI for browsing products
├── login.html                   # Login and Signup page
├── package.json                 # Node.js dependencies
├── sample_data.sql              # Sample categories and product data
├── script.js                    # Frontend logic for product/cart management
├── server.js                    # Express backend server
├── styles.css                   # Styling for all pages
```

---

## **API Endpoints**

| Method | Endpoint                                 | Description                   |
| ------ | ---------------------------------------- | ----------------------------- |
| POST   | `/api/auth/signup`                       | Register a new user.          |
| POST   | `/api/auth/login`                        | Log in an existing user.      |
| GET    | `/api/products`                          | Get a list of products.       |
| GET    | `/api/cart/:customerId`                  | Get the cart for a user.      |
| POST   | `/api/cart/:customerId/items`            | Add an item to the cart.      |
| DELETE | `/api/cart/:customerId/items/:productId` | Remove an item from the cart. |

---

### **Prerequisites**

* [Node.js](https://nodejs.org/)
* [MySQL](https://www.mysql.com/)

### **Installation**

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/shopease.git  
   cd shopease  
   ```

2. **Install dependencies**

   ```bash
   npm install  
   ```

3. **Set up the MySQL database**

   * Ensure MySQL is running.

   * Update the database credentials in `server.js`.

     ```javascript
     const db = mysql.createConnection({
         host: 'YOUR_DB_HOST',
         user: 'YOUR_DB_USER',
         password: 'YOUR_DB_PASSWORD',
         database: 'YOUR_DB_NAME'
     }).promise();
     ```

   * Import the SQL scripts into your MySQL client:

     ```bash
     source create_users_table.sql;  
     source sample_data.sql;  
     ```

4. **Run the server**

   ```bash
   npm start  
   ```

   The server will run at [http://localhost:3000](http://localhost:3000).

---

## User Interface

### **Login/SignUp UI**

![Login/SignUp UI](https://github.com/shubhankar05sarkar/ShopEase/blob/d6b44c686467737bdc440a2dafea549ccfd7f07c/Login-SignUp%20UI.png) 

### **Main UI**

![Main UI](https://github.com/shubhankar05sarkar/ShopEase/blob/d6b44c686467737bdc440a2dafea549ccfd7f07c/Main%20UI.png) 

### **Cart**

![Add to Cart](https://github.com/shubhankar05sarkar/ShopEase/blob/d6b44c686467737bdc440a2dafea549ccfd7f07c/Cart.png) 

---

## **Contributing**

Contributions are welcome! Feel free to submit issues or pull requests.

---

## **Author**

Created with ❤️ by **Shubhankar Sarkar** and **Avaneesh Bastimane**.
[GitHub Profile 1](https://github.com/shubhankar05sarkar)
[GitHub Profile 2](https://github.com/Avaneesh1905)
