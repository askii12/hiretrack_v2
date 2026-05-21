import prisma from "../config/prisma.js";

const logActivity = async ({
  userId,
  applicationId = null,
  jobId = null,
  candidateId = null,
  hireApplicationId = null,
  action,
  details = null,
}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        applicationId,
        jobId,
        candidateId,
        hireApplicationId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error("Activity log error:", error);
  }
};

export default logActivity;
