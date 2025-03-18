const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Set up Express app for testing
const app = express();
app.use(express.json());
app.use('/api', userRoutes);

describe('User Routes', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User registered successfully');

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.username).toBe('testuser');
      expect(await bcrypt.compare('password123', user.password)).toBe(true);
    });

    it('should fail if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
        });

      expect(response.status).toBe(500); // Since we don't have validation, it will fail on bcrypt.hash
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
      });
    });

    it('should login a user and return a token', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeTruthy();

      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBeTruthy();
    });

    it('should fail if email is incorrect', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User not found');
    });

    it('should fail if password is incorrect', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid password');
    });
  });
});