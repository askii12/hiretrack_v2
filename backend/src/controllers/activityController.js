import prisma from "../config/prisma.js";

export const getActivityLogs = async (req, res) => {
  try {
    const where =
      req.user.role === "ADMIN" || req.user.role === "RECRUITER"
        ? {}
        : { userId: req.user.id };

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({ message: "Server error while fetching activity logs" });
  }
};
