import bcrypt from "bcryptjs";
import prisma from "./prisma.js";

const createAdmin = async () => {
  try {
    const email = "admin@storerating.com";
    const password = "Admin@123";

    const existingAdmin = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const admin = await prisma.user.create({
      data: {
        name: "System Administrator",
        email,
        password: hashedPassword,
        address: "Pune, Maharashtra",
        role: "ADMIN",
      },
    });

    console.log("Admin created successfully");
    console.log("Email:", admin.email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Failed to create admin:", error);
  } finally {
    await prisma.$disconnect();
  }
};

createAdmin();