const express = require('express');
const { connectToDatabase, getDb } = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Connect to MongoDB before starting the server
let db;
connectToDatabase()
  .then((database) => {
    db = database;
    // Start the Express server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  });

// Sample data to use for initializing the collection
const products = [
  { name: 'Laptop', price: 1200, category: 'Electronics', stock: 45 },
  { name: 'Smartphone', price: 800, category: 'Electronics', stock: 120 },
  { name: 'Headphones', price: 100, category: 'Electronics', stock: 78 },
  { name: 'Monitor', price: 300, category: 'Electronics', stock: 35 },
  { name: 'Desk', price: 250, category: 'Furniture', stock: 23 },
  { name: 'Chair', price: 150, category: 'Furniture', stock: 50 },
  { name: 'Bookshelf', price: 180, category: 'Furniture', stock: 15 },
  { name: 'Coffee Table', price: 120, category: 'Furniture', stock: 8 },
  { name: 'T-shirt', price: 25, category: 'Clothing', stock: 200 },
  { name: 'Jeans', price: 60, category: 'Clothing', stock: 150 },
  { name: 'Jacket', price: 120, category: 'Clothing', stock: 85 },
  { name: 'Socks', price: 10, category: 'Clothing', stock: 300 }
];

// Initialize products collection with sample data
app.post('/api/init-products', async (req, res) => {
  try {
    const productsCollection = getDb().collection('products');
    
    // Delete all existing products first
    await productsCollection.deleteMany({});
    
    // Insert the sample products
    const result = await productsCollection.insertMany(products);
    
    res.status(201).json({
      message: `Initialized collection with ${result.insertedCount} products`,
      insertedIds: result.insertedIds
    });
  } catch (error) {
    console.error('Error initializing products:', error);
    res.status(500).json({ error: 'Failed to initialize products' });
  }
});

// Route using cursor to retrieve products with pagination
app.get('/api/products', async (req, res) => {
  try {
    const productsCollection = getDb().collection('products');
    
    // Get query parameters for pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    // Create cursor and apply pagination
    const cursor = productsCollection.find()
      .skip(skip)
      .limit(limit);
    
    // Count total documents for pagination info
    const totalProducts = await productsCollection.countDocuments();
    
    // Stream the results to the client
    const products = [];
    await cursor.forEach(product => {
      products.push(product);
    });
    
    res.json({
      data: products,
      pagination: {
        currentPage: page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Route using cursor with filters
app.get('/api/products/filter', async (req, res) => {
  try {
    const productsCollection = getDb().collection('products');
    
    // Extract filter parameters
    const { category, minPrice, maxPrice } = req.query;
    
    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }
    
    // Create cursor with filter
    const cursor = productsCollection.find(filter);
    
    // Stream results to the client
    const products = [];
    await cursor.forEach(product => {
      products.push(product);
    });
    
    res.json({
      filter: filter,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error filtering products:', error);
    res.status(500).json({ error: 'Failed to filter products' });
  }
});

// Route to stream large data set directly
app.get('/api/products/stream', async (req, res) => {
  try {
    const productsCollection = getDb().collection('products');
    
    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    
    // Create cursor
    const cursor = productsCollection.find();
    
    let firstItem = true;
    
    // Using cursor to stream each document as it's processed
    await cursor.forEach(product => {
      // Add comma between items, but not before the first one
      if (!firstItem) {
        res.write(',');
      } else {
        firstItem = false;
      }
      
      // Stream each product as JSON
      res.write(JSON.stringify(product));
    });
    
    // Close the JSON array
    res.write(']');
    res.end();
  } catch (error) {
    console.error('Error streaming products:', error);
    // If an error occurs during streaming, we might have already sent part of the response
    // Try to end with an error message if possible
    try {
      res.end(JSON.stringify({ error: 'Failed to stream products' }));
    } catch (e) {
      res.end();
    }
  }
});

// Aggregation route - get product statistics by category
app.get('/api/products/stats/by-category', async (req, res) => {
  try {
    const productsCollection = getDb().collection('products');
    
    // Define the aggregation pipeline
    const pipeline = [
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalStock: { $sum: '$stock' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];
    
    // Execute the aggregation pipeline
    const cursor = productsCollection.aggregate(pipeline);
    
    // Get all results
    const results = await cursor.toArray();
    
    res.json({
      categoryStats: results
    });
  } catch (error) {
    console.error('Error getting category statistics:', error);
    res.status(500).json({ error: 'Failed to get category statistics' });
  }
});

// Aggregation route - get price range distribution
app.get('/api/products/stats/price-ranges', async (req, res) => {
  try {
    const productsCollection = getDb().collection('products');
    
    // Define the aggregation pipeline
    const pipeline = [
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 50, 100, 200, 500, 1000, 2000],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            products: { $push: '$name' },
            averageStock: { $avg: '$stock' }
          }
        }
      }
    ];
    
    // Execute the aggregation pipeline
    const cursor = productsCollection.aggregate(pipeline);
    
    // Get all results
    const results = await cursor.toArray();
    
    res.json({
      priceRangeDistribution: results
    });
  } catch (error) {
    console.error('Error getting price range distribution:', error);
    res.status(500).json({ error: 'Failed to get price range distribution' });
  }
});

// Error handling for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
}); 