import bcrypt from "bcryptjs";
import prisma from "../prisma.js";

const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message:
          "Current password and new password are required",
      });
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be 8-16 characters and contain at least one uppercase letter and one special character",
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isCorrect =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!isCorrect) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update password",
    });
  }
};

export default updatePassword;