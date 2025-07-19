import express from 'express';
import UserRouter from './UserRoutes/users.route.mjs';
const router = express.Router();

class AllRoutes {
    static routes() {
        router.use("/admin", UserRouter);

        router.use("*", async (req, res) => {
            return res.status(500).json({
                result: {
                    success: false,
                    message: "The requested page not found.",
                },
                data: "",
            });
        });

        return router;
    }
}

export default AllRoutes.routes();
