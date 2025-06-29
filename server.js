// server.js - Starter Express server for Week 2 assignment

// Import required modules
    require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
 if (!process.env.API_KEY) {
      process.env.API_KEY = uuidv4();
      console.log(`🔑 Generated API_KEY: ${process.env.API_KEY}`);
    }

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());

// ===== MIDDLEWARE 
// - Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// - Authentication
/*const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
// Apply authentication to protected routes
app.use('/api/products', apiKeyMiddleware);
// ===== MIDDLEWARE REORDERING ENDS HERE =====
*/
// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Validation middleware for product creation and update
const validateProduct = (req, res, next) => {
  const { name, price, category } = req.body;
  
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: 'Invalid price' });
  }
  
  next();
};

// Apply validation to POST/PUT routes
app.post('/api/products', validateProduct);
app.put('/api/products/:id', validateProduct);

// - Error handling
// Custom error classes
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
});


// GET /api/products/:id - Get a specific product
app.get('/api/products/:id', (req, res, next) => {
  const product = products.find(u => u.id === req.params.id);
  if (!product) return next(new NotFoundError('Product not found'));
  res.json(product);
});

// POST /api/products - Create a new product
app.post('/api/products', (req, res) => {
  const newProduct = {
    id: uuidv4(),
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    inStock: req.body.inStock || true
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT /api/products/:id - Update a product
app.put('/api/products/:id', (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError('Product not found'));
  
  products[index] = { 
    ...products[index], 
    ...req.body,
    id: req.params.id 
  };
  res.json(products[index]);
});

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', (req, res, next) => {
  const initialLength = products.length;
  products = products.filter(p => p.id !== req.params.id);
  if (products.length === initialLength) {
    return next(new NotFoundError('Product not found'));
  }
  res.status(204).send();
});


// Combined filtering and pagination for GET /api/products
app.get('/api/products', (req, res) => {
  // Step 1: Filter by category if provided
  let result = [...products];
  if (req.query.category) {
    result = result.filter(p => p.category === req.query.category);
  }
  
  // Step 2: Apply pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  
  // Step 3: Paginate the results
  const paginatedResult = result.slice(startIndex, startIndex + limit);
  
  // Step 4: Return response
  res.json({
    page,
    limit,
    totalItems: result.length,
    data: paginatedResult
  });
});

// Search endpoint
app.get('/api/products/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing search query' });
  
  const results = products.filter(p => 
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.description.toLowerCase().includes(q.toLowerCase())
  );
  
  res.json(results);
});

// Product statistics
app.get('/api/products/stats', (req, res) => {
  const stats = {};
  products.forEach(product => {
    stats[product.category] = (stats[product.category] || 0) + 1;
  });
  res.json(stats);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      type: err.name || 'ServerError'
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app;