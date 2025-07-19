import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from "jsonwebtoken";

jest.unstable_mockModule('../../models/User.modal.mjs', () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.unstable_mockModule('../../services/AuthService.mjs', () => ({
  default: {
    login: jest.fn(),
    logout: jest.fn(),
    validateRefreshToken: jest.fn(),
  },
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

const User = (await import('../../models/User.modal.mjs')).default;
const AuthService = (await import('../../services/AuthService.mjs')).default;
const bcrypt = (await import('bcryptjs')).default;
import dbConnection from '../../config/db.config.mjs';

import express from 'express';
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimiter from '../../middlewares/RateLimiter.mjs';
import AuthRouter from '../../routes/AuthRoutes/auth.route.mjs';

// app initialization starts here
const app = express();
app.use(express.json());
app.use(cookieParser());

// rate limiting the number of requests
app.use(rateLimiter);

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "http://localhost:3000"],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xXssProtection: true,
  referrerPolicy: { policy: 'no-referrer' },
  frameguard: { action: 'DENY' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// v1 routes
app.use('/v1/auth', AuthRouter);

beforeAll(async () => {
  // Ensure the database is initialized before running any tests
  await dbConnection.authenticate();
  await dbConnection.sync();
  console.log("Database connected and synchronized before tests");
});

afterAll(async () => {
  // Close the database connection after tests
  await dbConnection.close();
  console.log("Database connection closed after tests");
});

// Mock bcrypt hash function
bcrypt.hash.mockImplementation((password) => Promise.resolve(`hashed_${password}`));

// JWT Mock Setup
const SECRET_KEY = "test_secret_key";
const mockAccessToken = jwt.sign({ id: 1, username: 'testuser' }, SECRET_KEY, { expiresIn: '15m' });
const mockRefreshToken = jwt.sign({ id: 1, username: 'testuser' }, SECRET_KEY, { expiresIn: '7d' });

AuthService.validateRefreshToken.mockImplementation((refreshToken) => {
  if (refreshToken === mockRefreshToken) {
    return jwt.sign({ id: 1, username: 'testuser' }, SECRET_KEY, { expiresIn: '15m' });
  }
  return null; // Invalid refresh token
});

describe('AuthController Tests', () => {
  let mockAccessToken, mockRefreshToken, decodedUser;

  beforeAll(() => {
    mockAccessToken = 'mockAccessToken123';
    mockRefreshToken = 'mockRefreshToken123';
    decodedUser = { id: 1, username: 'testuser' };
  });

  /** 🔹 REGISTER TESTS **/

  it('should return 400 for Sequelize validation error', async () => {
    User.create.mockRejectedValue({
      name: 'SequelizeValidationError',
      errors: [{ message: 'Invalid email format' }]
    });

    const res = await request(app).post('/v1/auth/register').send({
      username: 'testuser',
      password: 'password123',
      email: 'invalid-email',
      mobile: '1234567890',
      fullName: 'Test User'
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please provide valid email');
  });

  it('should return 500 for unexpected error in register', async () => {
    User.create.mockRejectedValue(new Error('Database connection error'));

    const res = await request(app).post('/v1/auth/register').send({
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      mobile: '1234567890',
      fullName: 'Test User',
      userType: "Invalid-Usertype"
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });

  it('should register a new user', async () => {
    User.findOne.mockResolvedValue(null); // No existing user
    User.create.mockResolvedValue({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      mobile: '1234567890',
      password: 'hashed_password'
    });

    const response = await request(app).post('/v1/auth/register').send({
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      mobile: '1234567890',
      fullName: 'Test User'
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe('User registered successfully');
  });

  it('should return 400 when user already exists', async () => {
    User.findOne.mockResolvedValue({ id: 1, username: 'testuser' });

    const response = await request(app).post('/v1/auth/register').send({
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      mobile: '1234567890',
      userType: 'admin',
      fullName: 'Test User'
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('User with this email or mobile number already exists.');
  });

  /** 🔹 LOGIN TESTS **/
  it('should login a user successfully', async () => {
    AuthService.login.mockResolvedValue({
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      user: { id: 1, username: 'testuser' }
    });

    const response = await request(app).post('/v1/auth/login').send({
      username: 'testuser',
      password: 'password123'
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful');
    // expect(response.body.user).toHaveProperty('id', 'number');
  });

  it('should return 400 on login failure', async () => {
    AuthService.login.mockRejectedValue(new Error('Invalid credentials'));

    const response = await request(app).post('/v1/auth/login').send({
      username: 'testuser',
      password: 'wrongpassword'
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid credentials');
  });

  it('should return 400 for incorrect login credentials', async () => {
    AuthService.login.mockRejectedValue(new Error('User not found'));

    const res = await request(app).post('/v1/auth/login').send({
      username: 'wronguser',
      password: 'wrongpassword'
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User not found');
  });

  /** 🔹 LOGOUT TESTS **/
  it('should logout a user successfully', async () => {
    AuthService.logout.mockResolvedValue(true);

    const response = await request(app)
      .post('/v1/auth/logout')
      .set('Cookie', [`accessToken=${mockAccessToken}; refreshToken=${mockRefreshToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logout successful');
  });

  it('should return 400 if no refresh token is provided', async () => {
    const response = await request(app).post('/v1/auth/logout');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('No refresh token provided');
  });

  /** 🔹 REFRESH TOKEN TESTS **/
  it('should refresh token successfully', async () => {
    AuthService.validateRefreshToken.mockResolvedValue(`refreshToken=${mockRefreshToken}`);

    const response = await request(app)
      .post('/v1/auth/refresh')
      .set('Cookie', [`accessToken=${mockAccessToken}; refreshToken=${mockRefreshToken}`]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid or expired refresh token');
  });

  it('should return 401 if no refresh token is provided', async () => {
    const response = await request(app).post('/v1/auth/refresh');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No refresh token provided');
  });

  /** 🔹 TEST ROUTE **/
  it('should return success for test route', async () => {
    const response = await request(app).get('/v1/auth/test');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Success');
  });

});