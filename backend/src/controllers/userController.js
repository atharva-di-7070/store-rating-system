import prisma from "../prisma.js";

// ==========================================
// Get All Stores
// ==========================================

const getStores = async (req, res) => {
  try {
    const {
      name,
      address,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const allowedSortFields = [
      "name",
      "email",
      "address",
    ];

    const safeSortBy = allowedSortFields.includes(
      sortBy
    )
      ? sortBy
      : "name";

    const safeSortOrder =
      sortOrder === "desc" ? "desc" : "asc";

    const stores = await prisma.store.findMany({
      where: {
        ...(name
          ? {
              name: {
                contains: name,
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

    const storesWithRatings = stores.map((store) => {
      const totalRatings = store.ratings.length;

      const averageRating =
        totalRatings > 0
          ? store.ratings.reduce(
              (sum, rating) =>
                sum + rating.rating,
              0
            ) / totalRatings
          : 0;

      const userRating = store.ratings.find(
        (rating) =>
          rating.userId === req.user.id
      );

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        overallRating: Number(
          averageRating.toFixed(2)
        ),
        userSubmittedRating:
          userRating?.rating ?? null,
      };
    });

    res.json({
      stores: storesWithRatings,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load stores",
    });
  }
};

// ==========================================
// Submit Rating
// ==========================================

const submitRating = async (req, res) => {
  try {
    const userId = req.user.id;

    const storeId = Number(req.params.storeId);

    const { rating } = req.body;

    if (!storeId || !rating) {
      return res.status(400).json({
        message: "Store ID and rating are required",
      });
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5",
      });
    }

    const store = await prisma.store.findUnique({
      where: {
        id: storeId,
      },
    });

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    const existingRating =
      await prisma.rating.findUnique({
        where: {
          userId_storeId: {
            userId,
            storeId,
          },
        },
      });

    if (existingRating) {
      return res.status(409).json({
        message:
          "You have already rated this store. Use the update endpoint to modify your rating.",
      });
    }

    const newRating = await prisma.rating.create({
      data: {
        rating,
        userId,
        storeId,
      },
    });

    res.status(201).json({
      message: "Rating submitted successfully",
      rating: newRating,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to submit rating",
    });
  }
};

// ==========================================
// Update Rating
// ==========================================

const updateRating = async (req, res) => {
  try {
    const userId = req.user.id;

    const storeId = Number(req.params.storeId);

    const { rating } = req.body;

    if (!storeId || !rating) {
      return res.status(400).json({
        message: "Store ID and rating are required",
      });
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5",
      });
    }

    const existingRating =
      await prisma.rating.findUnique({
        where: {
          userId_storeId: {
            userId,
            storeId,
          },
        },
      });

    if (!existingRating) {
      return res.status(404).json({
        message: "You have not rated this store yet",
      });
    }

    const updatedRating =
      await prisma.rating.update({
        where: {
          id: existingRating.id,
        },
        data: {
          rating,
        },
      });

    res.json({
      message: "Rating updated successfully",
      rating: updatedRating,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update rating",
    });
  }
};

export {
  getStores,
  submitRating,
  updateRating,
};