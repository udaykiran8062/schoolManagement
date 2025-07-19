import { DataTypes } from "sequelize";
import dbConnection from "../config/db.config.mjs";

const Token = dbConnection.define('tokens', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    refresh_token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    device_info: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    timestamps: false,
});

export default Token;