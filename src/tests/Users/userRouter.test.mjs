import request from 'supertest';
import express from 'express';
import UserRouter from '../../routes/UserRoutes/users.route.mjs';

const app = express();
app.use(UserRouter);

describe('User Router', () => {
  it('should return a welcome message', async () => {
    const response = await request(app).get('/user');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Welcome, User!' });
  });
});
