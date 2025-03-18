const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Task = require("../models/task");
const redisClient = require("../config/redis.js");



/**
 * @typedef {Object} TaskType
 * @property {string} _id
 * @property {string} title
 * @property {string} description
 * @property {"pending" | "completed"} status
 * @property {"low" | "medium" | "high"} priority
 * @property {string} userId
 * @property {Date} createdAt
 */

// Get Tasks
router.get("/tasks", authMiddleware, async (req, res) => {
  const { page = 1, limit = 10, status, priority } = req.query;

  let filters = { userId: req.user.userId };
  if (status) filters.status = status;
  if (priority) filters.priority = priority;

  try {
    if (!status && !priority) {
      const cachedTasks = await redisClient.get(`tasks:${req.user.userId}`);
      if (cachedTasks) {
        return res.json(JSON.parse(cachedTasks));
      }
    }

    const tasks = await Task.find(filters)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    if (tasks.length === 0) {
      return res.json({ message: "No tasks found" });
    }

    if (!status && !priority) {
      await redisClient.setEx(`tasks:${req.user.userId}`, 3600, JSON.stringify(tasks));
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Create Task
router.post("/tasks", authMiddleware, async (req, res) => {
  const { title, description, priority } = req.body;

  if (!title || !description || !priority) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newTask = new Task({
      title,
      description,
      priority,
      userId: req.user.userId,
    });

    await newTask.save();

    await redisClient.del(`tasks:${req.user.userId}`);

    res.status(201).json({ message: "Task created successfully", task: newTask });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update Task
router.put("/tasks/:id", authMiddleware, async (req, res) => {
  const { title, description, status, priority } = req.body;
  const updatedTask = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    { title, description, status, priority },
    { new: true }
  );

  if (!updatedTask) return res.status(404).json({ message: "Task not found" });

  await redisClient.del(`tasks:${req.user.userId}`);

  res.json(updatedTask);
});

// Delete Task
router.delete("/tasks/:id", authMiddleware, async (req, res) => {
  const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });

  if (!deletedTask) return res.status(404).json({ message: "Task not found" });

  await redisClient.del(`tasks:${req.user.userId}`);

  res.json({ message: "Task deleted successfully" });
});

// Get Tasks in Priority Order
router.get("/tasks/priority", authMiddleware, async (req, res) => {
  let sortedTasks = [];

  const tasks = await Task.find({ userId: req.user.userId });

  const taskQueue = require("../utils/priorityQueue").taskQueue;
  tasks.forEach((task) => taskQueue.add(task));

  while (!taskQueue.isEmpty()) {
    sortedTasks.push(taskQueue.poll());
  }

  res.json(sortedTasks);
});

module.exports = router;