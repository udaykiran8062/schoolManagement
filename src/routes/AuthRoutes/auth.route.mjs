import express from 'express';
import AuthController from '../../controllers/Auth.controller.mjs';

const AuthRouter = express.Router();

AuthRouter.post('/register', AuthController.register);
AuthRouter.post('/login', AuthController.login);
AuthRouter.post("/logout", AuthController.logout);
AuthRouter.get("/test", AuthController.test);
AuthRouter.post('/refresh', AuthController.refresh);

export default AuthRouter;