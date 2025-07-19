import jwtConfig from '../config/jwt.config.mjs';
import Token from '../models/Token.modal.mjs';
import jwt from 'jsonwebtoken';

class TokenManager {
    generateAccessToken(user) {
        return jwt.sign({ id: user.id, role: user.role }, jwtConfig.ACCESS_TOKEN_SECRET, { expiresIn: jwtConfig.ACCESS_TOKEN_EXPIRY });
    }

    generateRefreshToken(user) {
        return jwt.sign({ id: user.id }, jwtConfig.REFRESH_TOKEN_SECRET, { expiresIn: jwtConfig.REFRESH_TOKEN_EXPIRY });
    }

    async saveTokens(user, accessToken, refreshToken, ipAddress = null, deviceInfo = null) {
        // multilogin user support
        // const activeTokens = await Token.count({ where: { user_id: user.id } });
        // const maxLogins = 5;

        // if (activeTokens >= maxLogins) {
        //     const oldestToken = await Token.findOne({ where: { use_iId: user.id }, order: [['id', 'ASC']] });
        //     await oldestToken.destroy();
        // }

        // single login user token;
        await Token.destroy({
            where: {
                user_id: user.id,
            }
        });

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const createdAt = new Date();
        await Token.create({
            token: accessToken,
            refresh_token: refreshToken,
            ip_address: ipAddress,
            device_info: deviceInfo,
            user_id: user.id,
            expires_at: expiresAt,
            created_at: createdAt,
        });
    }

    async removeToken(refreshToken) {
        await Token.destroy({ where: { refresh_token: refreshToken } });
    }

    async findRefreshToken(refreshToken) {
        return await Token.findOne({ where: { refresh_token: refreshToken } });
    }

    async findToken(token, refreshToken) {
        return await Token.findOne({ where: { token, refresh_token: refreshToken } });
    }

    verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, jwtConfig.ACCESS_TOKEN_SECRET);
            return { valid: true, decoded };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    verifyRefreshToken(refreshToken) {
        try {
            jwt.verify(refreshToken, jwtConfig.REFRESH_TOKEN_SECRET);
            return { valid: true };
        } catch (error) {
            if (error.name === "TokenExpiredError") return { valid: false, error: "Session Expired!" }
            return { valid: false, error: error.message };
        }
    }
}

export default new TokenManager();