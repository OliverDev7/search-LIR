import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const db = await mysql.createPool({
    host: "localhost",
    user: "root",
    password: "", // tu contraseña de XAMPP
    database: "lir",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
