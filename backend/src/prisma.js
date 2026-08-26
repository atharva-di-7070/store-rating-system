import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "MySql@12345",
  database: "store_rating_db",
  connectionLimit: 5,
});

const prisma = new PrismaClient({
  adapter,
});

export default prisma;