const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();
const app = express();
app.use(express.json());

// Only connect to DB if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

app.use("/api", taskRoutes);
app.use("/api", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));