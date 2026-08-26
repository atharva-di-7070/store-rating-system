import bcrypt from "bcryptjs";
import prisma from "../prisma.js";

// ==========================================
// ADMIN DASHBOARD
// ==========================================

const getDashboard = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalStores = await prisma.store.count();
    const totalRatings = await prisma.rating.count();

    res.json({
      totalUsers,
      totalStores,
      totalRatings,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load admin dashboard",
    });
  }
};

// ==========================================
// ADD USER / ADMIN / STORE OWNER
// ==========================================

const addUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      address,
      role,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !address ||
      !role
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (name.length < 20 || name.length > 60) {
      return res.status(400).json({
        message:
          "Name must be between 20 and 60 characters",
      });
    }

    if (address.length > 400) {
      return res.status(400).json({
        message:
          "Address cannot exceed 400 characters",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 8-16 characters and contain at least one uppercase letter and one special character",
      });
    }

    const allowedRoles = [
      "USER",
      "ADMIN",
      "STORE_OWNER",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
        role,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create user",
    });
  }
};

// ==========================================
// ADD STORE
// ==========================================

const addStore = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      ownerId,
    } = req.body;

    if (!name || !email || !address) {
      return res.status(400).json({
        message:
          "Name, email and address are required",
      });
    }

    if (name.length < 20 || name.length > 60) {
      return res.status(400).json({
        message:
          "Store name must be between 20 and 60 characters",
      });
    }

    if (address.length > 400) {
      return res.status(400).json({
        message:
          "Address cannot exceed 400 characters",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }

    if (ownerId) {
      const owner =
        await prisma.user.findUnique({
          where: {
            id: Number(ownerId),
          },
        });

      if (!owner) {
        return res.status(404).json({
          message: "Store owner not found",
        });
      }

      if (owner.role !== "STORE_OWNER") {
        return res.status(400).json({
          message:
            "Selected user is not a Store Owner",
        });
      }
    }

    const store = await prisma.store.create({
      data: {
        name,
        email,
        address,
        ownerId: ownerId
          ? Number(ownerId)
          : null,
      },
    });

    res.status(201).json({
      message: "Store created successfully",
      store,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create store",
    });
  }
};

// ==========================================
// GET STORES
// ==========================================

const getStores = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const allowedSortFields = [
      "name",
      "email",
      "address",
    ];

    const safeSortBy =
      allowedSortFields.includes(sortBy)
        ? sortBy
        : "name";

    const safeSortOrder =
      sortOrder === "desc"
        ? "desc"
        : "asc";

    const stores =
      await prisma.store.findMany({
        where: {
          ...(name
            ? {
                name: {
                  contains: name,
                },
              }
            : {}),

          ...(email
            ? {
                email: {
                  contains: email,
                },
              }
            : {}),

          ...(address
            ? {
                address: {
                  contains: address,
                },
              }
            : {}),
        },

        orderBy: {
          [safeSortBy]: safeSortOrder,
        },

        include: {
          ratings: true,
        },
      });

    const result = stores.map((store) => {
      const totalRatings =
        store.ratings.length;

      const averageRating =
        totalRatings > 0
          ? store.ratings.reduce(
              (sum, rating) =>
                sum + rating.rating,
              0
            ) / totalRatings
          : 0;

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        rating: Number(
          averageRating.toFixed(2)
        ),
      };
    });

    res.json({
      stores: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load stores",
    });
  }
};

// ==========================================
// GET USERS
// ==========================================

const getUsers = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      role,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const allowedSortFields = [
      "name",
      "email",
      "address",
      "role",
    ];

    const safeSortBy =
      allowedSortFields.includes(sortBy)
        ? sortBy
        : "name";

    const safeSortOrder =
      sortOrder === "desc"
        ? "desc"
        : "asc";

    const users =
      await prisma.user.findMany({
        where: {
          ...(name
            ? {
                name: {
                  contains: name,
                },
              }
            : {}),

          ...(email
            ? {
                email: {
                  contains: email,
                },
              }
            : {}),

          ...(address
            ? {
                address: {
                  contains: address,
                },
              }
            : {}),

          ...(role
            ? {
                role,
              }
            : {}),
        },

        orderBy: {
          [safeSortBy]: safeSortOrder,
        },

        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          role: true,
        },
      });

    res.json({
      users,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load users",
    });
  }
};

// ==========================================
// GET USER DETAILS
// ==========================================

const getUserDetails = async (req, res) => {
  try {
    const userId = Number(
      req.params.userId
    );

    if (!userId) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          stores: {
            include: {
              ratings: true,
            },
          },
        },
      });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const result = {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
    };

    if (user.role === "STORE_OWNER") {
      result.stores = user.stores.map(
        (store) => {
          const totalRatings =
            store.ratings.length;

          const averageRating =
            totalRatings > 0
              ? store.ratings.reduce(
                  (sum, rating) =>
                    sum + rating.rating,
                  0
                ) / totalRatings
              : 0;

          return {
            storeId: store.id,
            storeName: store.name,
            rating: Number(
              averageRating.toFixed(2)
            ),
          };
        }
      );
    }

    res.json({
      user: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Failed to load user details",
    });
  }
};

export {
  getDashboard,
  addUser,
  addStore,
  getStores,
  getUsers,
  getUserDetails,
};