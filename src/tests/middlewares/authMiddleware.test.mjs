import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { jest } from "@jest/globals";
import dbConnection from '../../config/db.config.mjs';

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

// Mock TokenManager and AuthService
// Use unstable_mockModule before importing the actual module
jest.unstable_mockModule('../../utils/TokenManager.mjs', () => ({
  default: {
    findToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    saveTokens: jest.fn(),
    removeToken: jest.fn(),
    findRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  },
}));

jest.unstable_mockModule('../../services/AuthService.mjs', () => ({
  default: {
    validateRefreshToken: jest.fn(),
  },
}));

// Import modules after mocking
const TokenManager = (await import('../../utils/TokenManager.mjs')).default;
const AuthService = (await import('../../services/AuthService.mjs')).default;
const authenticateToken = (await import('../../middlewares/AuthMiddleware.mjs')).default;

// Setup Express app with middleware
const app = express();
app.use(cookieParser());
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Access Granted', user: req.user });
});

describe('AuthMiddleware Tests', () => {
  let mockAccessToken, mockRefreshToken, decodedUser;

  beforeAll(() => {
    mockAccessToken = 'mockAccessToken123';
    mockRefreshToken = 'mockRefreshToken123';
    decodedUser = { id: 1, username: 'testuser', role: 'user' };
  });

  // 🚀 TEST 1: Missing Access Token
  test('Should return 401 if no access token is provided', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized: No access token');
  });

  // 🚀 TEST 2: Invalid Session
  test('Should return 401 if session is invalid', async () => {
    TokenManager.findToken.mockResolvedValue(null);

    const res = await request(app)
      .get('/protected')
      .set('Cookie', [`accessToken=${mockAccessToken}; refreshToken=${mockRefreshToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid Session!');
  });

  // 🚀 TEST 3: Valid Access Token
  test('Should allow access if access token is valid', async () => {
    TokenManager.findToken.mockResolvedValue(true);
    TokenManager.verifyAccessToken.mockReturnValue({ valid: true, decoded: decodedUser });

    const res = await request(app)
      .get('/protected')
      .set('Cookie', [`accessToken=${mockAccessToken}; refreshToken=${mockRefreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access Granted');
    expect(res.body.user).toEqual(decodedUser);
  });

  // 🚀 TEST 4: Expired Access Token but Valid Refresh Token
  test('Should refresh token and grant access if access token is expired', async () => {
    const newAccessToken = 'newMockAccessToken123';

    TokenManager.findToken.mockResolvedValue(true);
    TokenManager.verifyAccessToken.mockReturnValue({ valid: false });
    AuthService.validateRefreshToken.mockResolvedValue(newAccessToken);
    TokenManager.verifyAccessToken.mockReturnValue({ valid: true, decoded: decodedUser });

    const res = await request(app)
      .get('/protected')
      .set('Cookie', [`accessToken=${mockAccessToken}; refreshToken=${mockRefreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access Granted');
    expect(res.body.user).toEqual(decodedUser);
  });

  // 🚀 TEST 5: Expired Access Token and Invalid Refresh Token
  test('Should return 401 if both access token and refresh token are invalid', async () => {
    TokenManager.findToken.mockResolvedValue(true);
    TokenManager.verifyAccessToken.mockReturnValue({ valid: false });
    AuthService.validateRefreshToken.mockResolvedValue(null);

    const res = await request(app)
      .get('/protected')
      .set('Cookie', [`accessToken=${mockAccessToken}; refreshToken=${mockRefreshToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized: Invalid refresh token');
  });

  // 🚀 TEST 6: Expired Access Token with No Refresh Token
  test('Should return 401 if refresh token is missing when access token is expired', async () => {
    TokenManager.findToken.mockResolvedValue(true);
    TokenManager.verifyAccessToken.mockReturnValue({ valid: false });

    const res = await request(app)
      .get('/protected')
      .set('Cookie', [`accessToken=${mockAccessToken}`]); // No refresh token

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized: No refresh token');
  });
});
