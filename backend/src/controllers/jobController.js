import prisma from "../config/prisma.js";
import logActivity from "../utils/logActivity.js";
import { jobsToCsv } from "../utils/exportHelpers.js";
import PDFDocument from "pdfkit";

export const createJob = async (req, res) => {
  try {
    const { title, description, department, location, status, salaryMin, salaryMax, skills } =
      req.body;

    if (!title) {
      return res.status(400).json({ message: "Job title is required" });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description: description || null,
        department: department || null,
        location: location || null,
        status: status || "OPEN",
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        skills: skills || null,
        recruiterId: req.user.id,
      },
      include: { recruiter: { select: { id: true, name: true, email: true } } },
    });

    await logActivity({
      userId: req.user.id,
      jobId: job.id,
      action: "JOB_CREATED",
      details: `${job.title} (${job.status})`,
    });

    res.status(201).json(job);
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ message: "Server error while creating job" });
  }
};

export const getJobs = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (req.user.role === "CANDIDATE") {
      where.status = "OPEN";
    } else if (req.user.role === "RECRUITER") {
      where.recruiterId = req.user.id;
    }

    if (status && status !== "All") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { department: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        recruiter: { select: { id: true, name: true, email: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(jobs);
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ message: "Server error while fetching jobs" });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        recruiter: { select: { id: true, name: true, email: true } },
        applications: {
          include: {
            candidate: { select: { id: true, name: true, email: true, skills: true } },
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (req.user.role === "CANDIDATE" && job.status !== "OPEN") {
      return res.status(403).json({ message: "Job is not open" });
    }

    if (req.user.role === "RECRUITER" && job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to view this job" });
    }

    res.status(200).json(job);
  } catch (error) {
    console.error("Get job error:", error);
    res.status(500).json({ message: "Server error while fetching job" });
  }
};

export const updateJob = async (req, res) => {
  try {
    const existing = await prisma.job.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (req.user.role === "RECRUITER" && existing.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to update this job" });
    }

    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: req.body,
    });

    await logActivity({
      userId: req.user.id,
      jobId: job.id,
      action: "JOB_UPDATED",
      details: `${job.title} (${job.status})`,
    });

    res.status(200).json(job);
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ message: "Server error while updating job" });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const existing = await prisma.job.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (req.user.role === "RECRUITER" && existing.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to delete this job" });
    }

    await logActivity({
      userId: req.user.id,
      jobId: existing.id,
      action: "JOB_DELETED",
      details: existing.title,
    });

    await prisma.job.delete({ where: { id: req.params.id } });

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({ message: "Server error while deleting job" });
  }
};

export const exportJobsCsv = async (req, res) => {
  try {
    const where =
      req.user.role === "RECRUITER" ? { recruiterId: req.user.id } : {};

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=hiretrack-jobs.csv");
    res.send(jobsToCsv(jobs));
  } catch (error) {
    console.error("Export jobs CSV error:", error);
    res.status(500).json({ message: "Server error while exporting jobs" });
  }
};
