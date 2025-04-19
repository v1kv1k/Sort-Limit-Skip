const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let dbConnection;

module.exports = {
  connectToDatabase: async () => {
    try {
      await client.connect();
      dbConnection = client.db();
      console.log('Successfully connected to MongoDB Atlas');
      return dbConnection;
    } catch (error) {
      console.error('Connection to MongoDB Atlas failed:', error);
      process.exit(1);
    }
  },
  getDb: () => dbConnection,
}; 