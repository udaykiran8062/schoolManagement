import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
dotenv.config({ path: ".env.local" });

const dbConnection = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT,
    logging: process.env.NODE_ENV === "test" ? false : console.log,
  }
);

dbConnection.authenticate().then(() => {
  console.log('Connected with database.');
}).catch(error => {
  console.log("Database connection error occurred:", error);
});

dbConnection.sync().then(() => {
  console.log('Database synchronized');
}).catch(error => {
  console.log("Database sync error occurred:", error);
});

export default dbConnection;