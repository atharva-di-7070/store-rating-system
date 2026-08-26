import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import storeOwnerRoutes from "./routes/storeOwnerRoutes.js";

import authMiddleware from "./middleware/authMiddleware.js";
import roleMiddleware from "./middleware/roleMiddleware.js";

const app = express();

// ==========================================
// Global Middleware
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// Health Check
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Store Rating API is running",
  });
});

// ==========================================
// Authentication
// ==========================================

app.use("/api/auth", authRoutes);

// ==========================================
// Admin
// ==========================================

app.use("/api/admin", adminRoutes);

// ==========================================
// Normal User
// ==========================================

app.use("/api/user", userRoutes);

// ==========================================
// Store Owner
// ==========================================

app.use("/api/store-owner", storeOwnerRoutes);

// ==========================================
// Protected Test
// ==========================================

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You can access this protected route",
    user: req.user,
  });
});

// ==========================================
// USER Test
// ==========================================

app.get(
  "/api/user-only",
  authMiddleware,
  roleMiddleware("USER"),
  (req, res) => {
    res.json({
      message: "Normal User access granted",
      user: req.user,
    });
  }
);

// ==========================================
// ADMIN Test
// ==========================================

app.get(
  "/api/admin-only",
  authMiddleware,
  roleMiddleware("ADMIN"),
  (req, res) => {
    res.json({
      message: "Admin access granted",
      user: req.user,
    });
  }
);

// ==========================================
// STORE OWNER Test
// ==========================================

app.get(
  "/api/store-owner-only",
  authMiddleware,
  roleMiddleware("STORE_OWNER"),
  (req, res) => {
    res.json({
      message: "Store Owner access granted",
      user: req.user,
    });
  }
);

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ==========================================
// Error Handler
// ==========================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    message: "Internal server error",
  });
});

// ==========================================
// Vercel Export
// ==========================================

export default app;

// ==========================================
// Local Development
// ==========================================

if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}