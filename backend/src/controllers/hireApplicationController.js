import prisma from "../config/prisma.js";
import logActivity from "../utils/logActivity.js";
import { notifyRecruitersForJob, dispatchHireNotification } from "../utils/notifications.js";

const includeRelations = {
  job: { select: { id: true, title: true, status: true, recruiterId: true } },
  candidate: { select: { id: true, name: true, email: true, skills: true } },
};

export const createHireApplication = async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: "Job id is required" });
    }

    if (req.user.role !== "CANDIDATE" || !req.user.candidateId) {
      return res.status(403).json({ message: "Only candidates can apply to jobs" });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job || job.status !== "OPEN") {
      return res.status(400).json({ message: "Job is not open for applications" });
    }

    const existing = await prisma.hireApplication.findUnique({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId: req.user.candidateId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: "You already applied to this job" });
    }

    const application = await prisma.hireApplication.create({
      data: {
        jobId,
        candidateId: req.user.candidateId,
        coverLetter: coverLetter || null,
      },
      include: includeRelations,
    });

    const candidate = application.candidate;

    await logActivity({
      userId: req.user.id,
      jobId,
      candidateId: req.user.candidateId,
      hireApplicationId: application.id,
      action: "CANDIDATE_APPLIED",
      details: `${candidate.name} applied to ${application.job.title}`,
    });

    await notifyRecruitersForJob(req, jobId, {
      type: "CANDIDATE_APPLIED",
      title: "New candidate applied",
      message: `${candidate.name} applied to ${application.job.title}`,
      emailSubject: `New application: ${application.job.title}`,
      emailBody: `${candidate.name} (${candidate.email}) applied to ${application.job.title}.`,
    });

    res.status(201).json(application);
  } catch (error) {
    console.error("Create hire application error:", error);
    res.status(500).json({ message: "Server error while creating application" });
  }
};

export const getHireApplications = async (req, res) => {
  try {
    const { status, jobId } = req.query;
    const where = {};

    if (req.user.role === "CANDIDATE") {
      where.candidateId = req.user.candidateId;
    } else if (req.user.role === "RECRUITER") {
      where.job = { recruiterId: req.user.id };
    }

    if (status && status !== "All") {
      where.status = status;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    const applications = await prisma.hireApplication.findMany({
      where,
      include: includeRelations,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(applications);
  } catch (error) {
    console.error("Get hire applications error:", error);
    res.status(500).json({ message: "Server error while fetching applications" });
  }
};

export const getHireApplicationById = async (req, res) => {
  try {
    const application = await prisma.hireApplication.findUnique({
      where: { id: req.params.id },
      include: includeRelations,
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (
      req.user.role === "CANDIDATE" &&
      application.candidateId !== req.user.candidateId
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (
      req.user.role === "RECRUITER" &&
      application.job.recruiterId !== req.user.id
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.status(200).json(application);
  } catch (error) {
    console.error("Get hire application error:", error);
    res.status(500).json({ message: "Server error while fetching application" });
  }
};

export const updateHireApplication = async (req, res) => {
  try {
    const existing = await prisma.hireApplication.findUnique({
      where: { id: req.params.id },
      include: includeRelations,
    });

    if (!existing) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (req.user.role === "RECRUITER" && existing.job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { status, interviewAt, notes, coverLetter } = req.body;

    const application = await prisma.hireApplication.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(interviewAt !== undefined
          ? { interviewAt: interviewAt ? new Date(interviewAt) : null }
          : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(coverLetter !== undefined ? { coverLetter } : {}),
      },
      include: includeRelations,
    });

    const statusChanged = existing.status !== application.status;

    await logActivity({
      userId: req.user.id,
      jobId: application.jobId,
      candidateId: application.candidateId,
      hireApplicationId: application.id,
      action: statusChanged ? "APPLICATION_STATUS_CHANGED" : "APPLICATION_UPDATED",
      details: statusChanged
        ? `${application.candidate.name}: ${existing.status} -> ${application.status}`
        : `${application.candidate.name} on ${application.job.title}`,
    });

    if (statusChanged && application.status === "INTERVIEW") {
      await notifyRecruitersForJob(req, application.jobId, {
        type: "APPLICATION_INTERVIEW_STAGE",
        title: "Candidate moved to interview",
        message: `${application.candidate.name} is now in INTERVIEW for ${application.job.title}`,
        emailSubject: `Interview stage: ${application.job.title}`,
        emailBody: `${application.candidate.name} moved to interview stage for ${application.job.title}.`,
      });

      if (application.candidate.userId) {
        await dispatchHireNotification(req, {
          type: "APPLICATION_INTERVIEW_STAGE",
          title: "You moved to interview stage",
          message: `Your application for ${application.job.title} is now in interview stage.`,
          recipientUserIds: [application.candidate.userId],
        });
      }
    }

    if (application.interviewAt && existing.interviewAt?.toISOString() !== application.interviewAt?.toISOString()) {
      const when = new Date(application.interviewAt).toLocaleString();

      await notifyRecruitersForJob(req, application.jobId, {
        type: "INTERVIEW_SCHEDULED",
        title: "Interview scheduled",
        message: `${application.candidate.name} — ${application.job.title} at ${when}`,
        emailSubject: `Interview scheduled: ${application.job.title}`,
        emailBody: `Interview for ${application.candidate.name} on ${application.job.title} scheduled at ${when}.`,
      });

      if (application.candidate.userId) {
        await dispatchHireNotification(req, {
          type: "INTERVIEW_SCHEDULED",
          title: "Interview scheduled",
          message: `Interview for ${application.job.title} scheduled at ${when}.`,
          recipientUserIds: [application.candidate.userId],
        });
      }
    }

    res.status(200).json(application);
  } catch (error) {
    console.error("Update hire application error:", error);
    res.status(500).json({ message: "Server error while updating application" });
  }
};

export const deleteHireApplication = async (req, res) => {
  try {
    const existing = await prisma.hireApplication.findUnique({
      where: { id: req.params.id },
      include: includeRelations,
    });

    if (!existing) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (
      req.user.role === "CANDIDATE" &&
      existing.candidateId !== req.user.candidateId
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await prisma.hireApplication.delete({ where: { id: req.params.id } });

    res.status(200).json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Delete hire application error:", error);
    res.status(500).json({ message: "Server error while deleting application" });
  }
};
