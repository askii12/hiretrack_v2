import prisma from "../config/prisma.js";
import logActivity from "../utils/logActivity.js";
import PDFDocument from "pdfkit";

export const createCandidate = async (req, res) => {
  try {
    const { name, email, phone, resume, skills, userId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        phone: phone || null,
        resume: resume || null,
        skills: skills || null,
        userId: userId || null,
      },
    });

    await logActivity({
      userId: req.user.id,
      candidateId: candidate.id,
      action: "CANDIDATE_CREATED",
      details: `${candidate.name} <${candidate.email}>`,
    });

    res.status(201).json(candidate);
  } catch (error) {
    console.error("Create candidate error:", error);
    res.status(500).json({ message: "Server error while creating candidate" });
  }
};

export const getCandidates = async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};

    if (req.user.role === "CANDIDATE") {
      if (!req.user.candidateId) {
        return res.status(200).json([]);
      }
      where.id = req.user.candidateId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { skills: { contains: search } },
      ];
    }

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(candidates);
  } catch (error) {
    console.error("Get candidates error:", error);
    res.status(500).json({ message: "Server error while fetching candidates" });
  }
};

export const getCandidateById = async (req, res) => {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: req.params.id },
      include: {
        applications: {
          include: {
            job: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (req.user.role === "CANDIDATE" && candidate.id !== req.user.candidateId) {
      return res.status(403).json({ message: "Not allowed to view this candidate" });
    }

    res.status(200).json(candidate);
  } catch (error) {
    console.error("Get candidate error:", error);
    res.status(500).json({ message: "Server error while fetching candidate" });
  }
};

export const updateCandidate = async (req, res) => {
  try {
    const existing = await prisma.candidate.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (req.user.role === "CANDIDATE" && existing.id !== req.user.candidateId) {
      return res.status(403).json({ message: "Not allowed to update this candidate" });
    }

    const candidate = await prisma.candidate.update({
      where: { id: req.params.id },
      data: req.body,
    });

    await logActivity({
      userId: req.user.id,
      candidateId: candidate.id,
      action: "CANDIDATE_UPDATED",
      details: candidate.name,
    });

    res.status(200).json(candidate);
  } catch (error) {
    console.error("Update candidate error:", error);
    res.status(500).json({ message: "Server error while updating candidate" });
  }
};

export const deleteCandidate = async (req, res) => {
  try {
    const existing = await prisma.candidate.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    await logActivity({
      userId: req.user.id,
      candidateId: existing.id,
      action: "CANDIDATE_DELETED",
      details: existing.name,
    });

    await prisma.candidate.delete({ where: { id: req.params.id } });

    res.status(200).json({ message: "Candidate deleted successfully" });
  } catch (error) {
    console.error("Delete candidate error:", error);
    res.status(500).json({ message: "Server error while deleting candidate" });
  }
};

export const exportCandidatesPdf = async (req, res) => {
  try {
    const where =
      req.user.role === "CANDIDATE" && req.user.candidateId
        ? { id: req.user.candidateId }
        : {};

    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=hiretrack-candidates.pdf");

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(20).text("HireTrack Candidates Report");
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    candidates.forEach((candidate, index) => {
      doc.fontSize(13).text(`${index + 1}. ${candidate.name}`, { underline: true });
      doc.fontSize(10).text(`Email: ${candidate.email}`);
      if (candidate.phone) doc.text(`Phone: ${candidate.phone}`);
      if (candidate.skills) doc.text(`Skills: ${candidate.skills}`);
      if (candidate.resume) doc.text(`Resume: ${candidate.resume.slice(0, 500)}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error("Export candidates PDF error:", error);
    res.status(500).json({ message: "Server error while exporting candidates PDF" });
  }
};
