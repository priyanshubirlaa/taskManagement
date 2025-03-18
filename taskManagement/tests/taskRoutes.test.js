const request = require('supertest');
const express = require('express');
const taskRoutes = require('../routes/taskRoutes');
const Task = require('../models/task');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Mock Redis by requiring redis-mock inside the factory
jest.mock('../config/redis', () => {
  const redisMock = require('redis-mock');
  return {
    createClient: () => redisMock.createClient(),
  };
});

// Set up Express app for testing
const app = express();
app.use(express.json());
app.use('/api', taskRoutes);

describe('Task Routes', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Create a user and generate a token
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
    });
    userId = user._id;
    token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(async () => {
    await Task.deleteMany({});
    // Clear Redis mock
    const redisClient = require('../config/redis');
    redisClient.flushall();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          priority: 'high',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Task created successfully');
      expect(response.body.task.title).toBe('Test Task');

      const task = await Task.findOne({ title: 'Test Task' });
      expect(task).toBeTruthy();
      expect(task.userId.toString()).toBe(userId.toString());
    });

    it('should fail if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('All fields are required');
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await Task.create([
        { title: 'Task 1', description: 'Desc 1', priority: 'high', userId, status: 'pending' },
        { title: 'Task 2', description: 'Desc 2', priority: 'low', userId, status: 'completed' },
      ]);
    });

    it('should get tasks with pagination', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Task 1');
    });

    it('should filter tasks by status and priority', async () => {
      const response = await request(app)
        .get('/api/tasks?status=completed&priority=low')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Task 2');
    });

    it('should use Redis cache when no filters are applied', async () => {
      const redisClient = require('../config/redis');
      await redisClient.setEx(`tasks:${userId}`, 3600, JSON.stringify([{ title: 'Cached Task' }]));

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body[0].title).toBe('Cached Task');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Task to Update',
        description: 'Desc',
        priority: 'medium',
        userId,
        status: 'pending',
      });
      taskId = task._id;
    });

    it('should update a task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Task',
          description: 'Updated Desc',
          priority: 'high',
          status: 'completed',
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Task');
      expect(response.body.status).toBe('completed');
    });

    it('should fail if task not found', async () => {
      const response = await request(app)
        .put('/api/tasks/123456789012')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Task',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Task not found');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Task to Delete',
        description: 'Desc',
        priority: 'medium',
        userId,
        status: 'pending',
      });
      taskId = task._id;
    });

    it('should delete a task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Task deleted successfully');

      const task = await Task.findById(taskId);
      expect(task).toBeNull();
    });

    it('should fail if task not found', async () => {
      const response = await request(app)
        .delete('/api/tasks/123456789012')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Task not found');
    });
  });

  describe('GET /api/tasks/priority', () => {
    beforeEach(async () => {
      await Task.create([
        { title: 'Task 1', description: 'Desc 1', priority: 'low', userId, status: 'pending' },
        { title: 'Task 2', description: 'Desc 2', priority: 'high', userId, status: 'pending' },
        { title: 'Task 3', description: 'Desc 3', priority: 'medium', userId, status: 'pending' },
      ]);
      const { taskQueue } = require('../utils/priorityQueue');
      while (!taskQueue.isEmpty()) {
        taskQueue.poll();
      }
    });

    it('should get tasks sorted by priority', async () => {
      const response = await request(app)
        .get('/api/tasks/priority')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
      expect(response.body[0].priority).toBe('high');
      expect(response.body[1].priority).toBe('medium');
      expect(response.body[2].priority).toBe('low');
    });
  });
});