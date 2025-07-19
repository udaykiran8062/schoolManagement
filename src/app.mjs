import "dotenv/config";
import express from 'express';
import cookieParser from "cookie-parser";
import AllRoutes from "./routes/route.mjs";
import authenticateToken from "./middlewares/AuthMiddleware.mjs";
import rateLimiter from "./middlewares/RateLimiter.mjs";
import AuthRouter from './routes/AuthRoutes/auth.route.mjs'
import helmet from "helmet";
import cors from 'cors';

// app initialization starts here
const app = express();
app.use(express.json());
app.use(cookieParser());
const PORT = process.env.PORT || 3000;

// cors initialization
app.use(
    cors({
        origin: ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
        exposedHeaders: ['Authorization']
    })
);


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

app.use('/v1', authenticateToken, AllRoutes);

// Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

export default app;