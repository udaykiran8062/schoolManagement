import bcrypt from 'bcryptjs';
import User from '../models/User.modal.mjs';
import TokenManager from '../utils/TokenManager.mjs';
import { Op } from 'sequelize';

class AuthService {
    async login(username, password, userType, ipAddress = null, deviceInfo = null, id = null) {
        const whereCondition = {
            where: {
                [Op.or]: {
                    username: username,
                    email: username,
                    mobile: username,
                    // isValid :0,
                }
            },
        };

        if (userType || userType === 0) {
            whereCondition.where.user_type = userType;
        }

        if (id) {
            whereCondition.where.id = parseInt(id);
        }

        const users = await User.findAll({
            attributes: ['id', 'username', 'password', 'user_type', 'role',
                'full_name', 'email', 'mobile', 'grade', 'schoolId'],

            ...whereCondition
        });

        let usersList = [];

        if (!users.length) throw new Error('User not found');

        let isPasswordValid = false;

        for (let eachUser of users) {
            const findPassword = bcrypt.compareSync(password, eachUser.password);

            if (findPassword) {
                isPasswordValid = true;
                usersList.push(eachUser);
            }
        }

        if (!isPasswordValid) throw new Error('Invalid credentials');

        if (usersList.length > 1) {
            return { isLogin: false, usersList: usersList }
        }

        const user = usersList[0];

        const accessToken = TokenManager.generateAccessToken(user);
        const refreshToken = TokenManager.generateRefreshToken(user);

        await TokenManager.saveTokens(user, accessToken, refreshToken, ipAddress, deviceInfo);

        return { isLogin: true, accessToken, refreshToken, user };
    }

    async logout(refreshToken) {
        await TokenManager.removeToken(refreshToken);
    }

    async validateRefreshToken(refreshToken) {
        const tokenEntry = await TokenManager.findRefreshToken(refreshToken);
        if (!tokenEntry) throw new Error('Invalid or expired refresh token');

        const { valid, error } = TokenManager.verifyRefreshToken(refreshToken);

        if (!valid) {
            await tokenEntry.destroy();
            throw new Error(error);
        }

        const user = await User.findByPk(tokenEntry.user_id);
        if (!user) throw new Error('User not found');

        const newAccessToken = TokenManager.generateAccessToken(user);

        await tokenEntry.update({ token: newAccessToken });

        return newAccessToken;
    }
}

export default new AuthService();
