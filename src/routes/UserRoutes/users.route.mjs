import express from "express";

const UserRouter = express.Router();

UserRouter.get('/user', (req, res) => {
    res.json({ message: 'Welcome, User!' });
});

export default UserRouter;
