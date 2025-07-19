import bcrypt from 'bcryptjs';
import User from '../models/User.modal.mjs';
import AuthService from '../services/AuthService.mjs';

class AuthController {
    // Register a new user
    async register(req, res) {
        const { password, mobile, email, userType, fullName } = req.body;

        try {
            const existingUser = await User.findOne({
                where: {
                    email: email,
                    mobile: mobile,
                    user_type: userType || 0,
                },
            });

            if (existingUser) {
                return res.status(400).json({ status: false, message: 'User with this email or mobile number already exists.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const usersData = {
                username,
                password: hashedPassword,
                mobile: mobile,
                email: email,
                user_type: userType || 0,
                full_name: fullName
            };

            const newUser = await User.create(usersData);

            res.status(201).json({
                status: true,
                message: 'User registered successfully',
                data: newUser,
            });
        } catch (error) {
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    status: false,
                    message: error.errors.map(err => err.message)[0]
                });
            }
            res.status(500).json({ status: false, message: 'Internal server error' });
        }
    }

    async login(req, res) {
        try {
            const { username, password, userType, id } = req.body;
            const ipAddress = req.ip;
            const deviceInfo = req.headers['user-agent'];

            const { isLogin, accessToken, refreshToken, user, usersList } = await AuthService.login(username, password, userType, ipAddress, deviceInfo, id);

            if (!isLogin) {
                return res.json({ status: true, isLogin, user: usersList });
            }

            const relevantUserData = {
                userId: user.id,
                grade: user.grade,
                schoolId: user.schoolId,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                mobile: user.mobile,
                userType: user.user_type
            };

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
                maxAge: 15 * 60 * 1000, // 15 min
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
                maxAge: 24 * 60 * 60 * 1000, // 1 day
            });

            res.set("Authorization", `Bearer ${accessToken}`);

            res.json({
                isLogin,
                status: 201,
                success: true,
                message: 'Login successful',
                user: relevantUserData,
                token: accessToken,
                refreshToken,
            });
        } catch (error) {
            res.status(400).json({
                status: 400,
                success: false,
                message: error.message
            });
        }
    }

    async logout(req, res) {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) throw new Error('No refresh token provided');

            await AuthService.logout(refreshToken);

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            res.json({ message: 'Logout successful' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async refresh(req, res) {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) throw new Error('No refresh token provided');

            // check if token is valid or not
            const newAccessToken = await AuthService.validateRefreshToken(refreshToken);

            if (!newAccessToken) {
                throw new Error("Unauthorized: Invalid refresh token");
            }

            // Set new access token in cookie
            res.cookie("accessToken", newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: "Strict",
                maxAge: 15 * 60 * 1000, // 15 min
            });

            valid = true;
            decoded = TokenManager.verifyAccessToken(newAccessToken).decoded;

            res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
            res.json({ message: 'Token refreshed' });
        } catch (error) {
            let errorMessage = error.message;
            if (error.name === "TokenExpiredError") errorMessage = "Unauthorized: refresh token expired";

            // Object.keys(req.cookies).forEach((cookie) => {
            //   res.clearCookie(cookie);
            // });

            // 401 means user should be logout
            return res
                .status(401)
                .json({ status: false, message: errorMessage });
        }
    }

    async test(req, res) {
        return res.json({ message: "Success" });
    }
}

export default new AuthController();
