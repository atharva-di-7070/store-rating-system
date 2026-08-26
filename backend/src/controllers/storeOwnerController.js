import prisma from "../prisma.js";

const getDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Find stores owned by this user
    const stores = await prisma.store.findMany({
      where: {
        ownerId,
      },
      include: {
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    const dashboard = stores.map((store) => {
      const totalRatings = store.ratings.length;

      const averageRating =
        totalRatings > 0
          ? store.ratings.reduce(
              (sum, rating) => sum + rating.rating,
              0
            ) / totalRatings
          : 0;

      return {
        store: {
          id: store.id,
          name: store.name,
          email: store.email,
          address: store.address,
        },
        averageRating: Number(
          averageRating.toFixed(2)
        ),
        totalRatings,
        users: store.ratings.map((rating) => ({
          ratingId: rating.id,
          rating: rating.rating,
          submittedAt: rating.createdAt,
          user: rating.user,
        })),
      };
    });

    res.json({
      stores: dashboard,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load Store Owner dashboard",
    });
  }
};

export {
  getDashboard,
};