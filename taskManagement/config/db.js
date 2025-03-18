const mongoose = require("mongoose");

const connectDB = () => {
  if (process.env.NODE_ENV === 'test') {
    return; // Skip connection in test environment
  }
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
};

module.exports = connectDB;