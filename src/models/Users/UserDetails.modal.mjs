import { DataTypes } from 'sequelize';
import dbConnection from '../config/db.config.mjs';

const User = dbConnection.define('user_details', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    grade: {
        type: DataTypes.BIGINT,
        allowNull: true,
    }
},
    {
        timestamps: false,
    }
);

export default User;