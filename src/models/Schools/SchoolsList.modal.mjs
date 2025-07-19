import { DataTypes } from 'sequelize';
import dbConnection from '../../config/db.config.mjs';

const SchoolsList = dbConnection.define('shools_list', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    shool_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    del_flag: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
        comment: "1-deleted, 0-available (default 0)"
    },
}, {
    timestamps: false,
});

export default SchoolsList;