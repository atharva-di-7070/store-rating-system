import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  getDashboard,
} from "../controllers/storeOwnerController.js";

import updatePassword from "../controllers/passwordController.js";

const router = express.Router();

// ==========================================
// Dashboard
// ==========================================

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("STORE_OWNER"),
  getDashboard
);

// ==========================================
// Update Password
// ==========================================

router.put(
  "/password",
  authMiddleware,
  roleMiddleware("STORE_OWNER"),
  updatePassword
);

export default router;