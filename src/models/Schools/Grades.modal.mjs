import { DataTypes } from "sequelize";
import dbConnection from "../../config/db.config.mjs";

const Grades = dbConnection.define("grades", {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            isIn: {
                args: [1, 50],
                msg: "Grade name should be less than 50 characters",
            }
        }
    }
}, {
    timestamps: false,
});

export default Grades;