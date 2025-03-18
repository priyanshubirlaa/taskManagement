const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "low" },
  userId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;