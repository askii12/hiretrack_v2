import prisma from "../config/prisma.js";
import { statsToCsv } from "../utils/exportHelpers.js";

const buildStats = async (user) => {
  const jobWhere = user.role === "RECRUITER" ? { recruiterId: user.id } : {};

  const applicationWhere =
    user.role === "RECRUITER"
      ? { job: { recruiterId: user.id } }
      : user.role === "CANDIDATE"
        ? { candidateId: user.candidateId }
        : {};

  const [jobsTotal, jobsOpen, candidatesTotal, applicationsTotal, applicationsByStatus] =
    await Promise.all([
      prisma.job.count({ where: jobWhere }),
      prisma.job.count({ where: { ...jobWhere, status: "OPEN" } }),
      prisma.candidate.count(
        user.role === "CANDIDATE" && user.candidateId
          ? { where: { id: user.candidateId } }
          : undefined,
      ),
      prisma.hireApplication.count({ where: applicationWhere }),
      prisma.hireApplication.groupBy({
        by: ["status"],
        where: applicationWhere,
        _count: { status: true },
      }),
    ]);

  const statusCounts = applicationsByStatus.reduce((acc, row) => {
    acc[row.status] = row._count.status;
    return acc;
  }, {});

  return {
    jobsTotal,
    jobsOpen,
    candidatesTotal,
    applicationsTotal,
    statusCounts,
  };
};

export const getHiringStats = async (req, res) => {
  try {
    const stats = await buildStats(req.user);
    res.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Server error while fetching stats" });
  }
};

export const exportStatsCsv = async (req, res) => {
  try {
    const stats = await buildStats(req.user);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=hiretrack-stats.csv");
    res.send(statsToCsv(stats));
  } catch (error) {
    console.error("Export stats error:", error);
    res.status(500).json({ message: "Server error while exporting stats" });
  }
};
