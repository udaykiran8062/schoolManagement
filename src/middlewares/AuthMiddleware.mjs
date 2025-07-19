import AuthService from '../services/AuthService.mjs';
import TokenManager from '../utils/TokenManager.mjs';

const authenticateToken = async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    let { valid, decoded } = TokenManager.verifyAccessToken(accessToken || token);

    if (!valid) {
      const { refreshToken: existingRefreshToken } = await TokenManager.getRefreshToken(token || accessToken);

      if (!refreshToken && !existingRefreshToken) throw new Error("Unauthorized: No refresh token");

      const { newAccessToken, newRefreshToken } = await AuthService.validateRefreshToken(existingRefreshToken || refreshToken);

      if (!newAccessToken) {
        throw new Error("Unauthorized: Invalid refresh token");
      }

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
        maxAge: 15 * 60 * 1000, // 15 min
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      res.set("Authorization", `Bearer ${newAccessToken}`);

      valid = true;
      decoded = TokenManager.verifyAccessToken(newAccessToken).decoded;
    } else {
      // setting header on every response
      res.set("Authorization", `Bearer ${accessToken || token}`);
    }

    req.user = decoded;
    next();

  } catch (error) {
    console.error("Authentication error:", error.message);

    // Clear cookies if authentication fails
    Object.keys(req.cookies).forEach((cookie) => {
      res.clearCookie(cookie);
    });

    return res.status(401).json({ status: false, message: error.message });
  }
};

export default authenticateToken;