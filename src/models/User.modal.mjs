import { DataTypes } from 'sequelize';
import dbConnection from '../config/db.config.mjs';

const User = dbConnection.define('users', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        unique: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    full_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: {
                args: [0, 100],
                msg: "Full name shouldn't be more than 100 characters"
            }
        },
    },
    mobile: {
        type: DataTypes.STRING,
        allowNull: false,
        // validate: {
        //     len: {
        //         args: [0, 15],
        //         msg: "Please provide valid mobile number"
        //     },
        //     is: {
        //         args: /^[0-9+\-()]+$/,
        //         msg: "Please provide valid mobile number"
        //     }
        // },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        // validate: {
        //     len: {
        //         args: [0, 150],
        //         msg: "Please provide valid email"
        //     },
        //     is: {
        //         args: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/,
        //         msg: "Please provide valid email"
        //     }
        // },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Password cannot be empty.",
            },

            // len: {
            //     args: [8, 20],
            //     msg: "Password length should be between 8 to 20",
            // },
            // is: {
            //     args: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,20}$/g,
            //     msg: "Please provide valid password",
            // },
        }
    },
    user_type: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
        comment: "0-student, 1-parent, 2-teacher, 3-school, 4-admin, 5-internal-user (default-0)",
        validate: {
            isIn: {
                args: [[0, 1, 2, 3, 4, 5]],
                msg: "Invalid user type",
            }
        }
    },
    status: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 1,
        comment: "0 - Inactive, 1 - Active (default 1)",
        validate: {
            isIn: {
                args: [[0, 1]],
                msg: "Status must be either 0 (Inactive) or 1 (Active).",
            }
        },
    },
    role: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
    },
    isValid: {
        type: DataTypes.SMALLINT,
        defaultValue: 0,
        // comment: "0 - updated, 1 - notUpdated password (default 1)",
        validate: {
            isIn: {
                args: [[0, 1]],
                // msg: "Status must be either 0 () or 1 ().",
            },
        },
    }
},
    {
        sequelize: dbConnection,
        tableName: 'users',
        timestamps: false,
        hooks: {
            afterSync: async () => {
                await dbConnection.query(`
            ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_type;
            ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_status;
            ALTER TABLE users 
            ADD CONSTRAINT chk_user_type CHECK (user_type IN (0, 1, 2, 3, 4, 5)),
            ADD CONSTRAINT chk_status CHECK (status IN (0, 1));
        `);
            }
        }
    });

export default User;
