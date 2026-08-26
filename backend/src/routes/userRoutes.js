import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  getStores,
  submitRating,
  updateRating,
} from "../controllers/userController.js";

import updatePassword from "../controllers/passwordController.js";

const router = express.Router();

// ==========================================
// Stores
// ==========================================

router.get(
  "/stores",
  authMiddleware,
  roleMiddleware("USER"),
  getStores
);

// ==========================================
// Submit Rating
// ==========================================

router.post(
  "/stores/:storeId/rating",
  authMiddleware,
  roleMiddleware("USER"),
  submitRating
);

// ==========================================
// Update Rating
// ==========================================

router.put(
  "/stores/:storeId/rating",
  authMiddleware,
  roleMiddleware("USER"),
  updateRating
);

// ==========================================
// Update Password
// ==========================================

router.put(
  "/password",
  authMiddleware,
  updatePassword
);

export default router;