require('dotenv').config();

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

// Set up Express app for testing
const app = express();
app.use(express.json());

// Test route with auth middleware
app.get('/test', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Protected route accessed' });
});

describe('Auth Middleware', () => {
  let token;

  beforeAll(() => {
    // Set a default JWT_SECRET if not provided in .env
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    token = jwt.sign({ userId: '123' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  it('should allow access with a valid token', async () => {
    const response = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Protected route accessed');
  });

  it('should deny access without a token', async () => {
    const response = await request(app)
      .get('/test');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Access Denied: No Token');
  });

  it('should deny access with an invalid token', async () => {
    const response = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer invalidtoken');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid Token');
  });
});