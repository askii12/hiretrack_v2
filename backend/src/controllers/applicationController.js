import prisma from "../config/prisma.js";
import logActivity from "../utils/logActivity.js";
import PDFDocument from "pdfkit";
import { applicationsToCsv } from "../utils/exportHelpers.js";
import { sendApplicationEmail } from "../utils/mailer.js";
import { notifyUser } from "../utils/notify.js";

export const createApplication = async (req, res) => {
  try {
    const {
      companyName,
      positionTitle,
      status,
      location,
      salaryMin,
      salaryMax,
      jobLink,
      notes,
      priority,
      appliedDate,
      nextStepDate,
    } = req.body;

    if (!companyName || !positionTitle) {
      return res.status(400).json({
        message: "Company name and position title are required",
      });
    }

    const application = await prisma.jobApplication.create({
      data: {
        companyName,
        positionTitle,
        status: status || "Wishlist",
        location: location || null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        jobLink: jobLink || null,
        notes: notes || null,
        priority: priority || "Medium",
        appliedDate: appliedDate ? new Date(appliedDate) : null,
        nextStepDate: nextStepDate ? new Date(nextStepDate) : null,
        userId: req.user.id,
      },
    });

    await logActivity({
      userId: req.user.id,
      applicationId: application.id,
      action: "APPLICATION_CREATED",
      details: `${application.companyName} - ${application.positionTitle}`,
    });

    notifyUser(req, req.user.id, {
      type: "APPLICATION_CREATED",
      title: "New application added",
      message: `${application.companyName} - ${application.positionTitle}`,
    });

    res.status(201).json(application);
  } catch (error) {
    console.error("Create application error:", error);
    res
      .status(500)
      .json({ message: "Server error while creating application" });
  }
};

export const getApplications = async (req, res) => {
  try {
    const { status, priority, search, sortBy, order } = req.query;

    const where = {
      userId: req.user.id,
    };

    if (status && status !== "All") {
      where.status = status;
    }

    if (priority && priority !== "All") {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        {
          companyName: {
            contains: search,
          },
        },
        {
          positionTitle: {
            contains: search,
          },
        },
      ];
    }

    const allowedSortFields = [
      "createdAt",
      "appliedDate",
      "nextStepDate",
      "companyName",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const finalOrder = order === "asc" ? "asc" : "desc";

    const applications = await prisma.jobApplication.findMany({
      where,
      orderBy: {
        [finalSortBy]: finalOrder,
      },
    });

    res.status(200).json(applications);
  } catch (error) {
    console.error("Get applications error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching applications" });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json(application);
  } catch (error) {
    console.error("Get application by id error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching application" });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existingApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    const {
      companyName,
      positionTitle,
      status,
      location,
      salaryMin,
      salaryMax,
      jobLink,
      notes,
      priority,
      appliedDate,
      nextStepDate,
    } = req.body;

    const updatedApplication = await prisma.jobApplication.update({
      where: {
        id: req.params.id,
      },
      data: {
        companyName,
        positionTitle,
        status,
        location: location || null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        jobLink: jobLink || null,
        notes: notes || null,
        priority,
        appliedDate: appliedDate ? new Date(appliedDate) : null,
        nextStepDate: nextStepDate ? new Date(nextStepDate) : null,
      },
    });

    const statusChanged =
      existingApplication.status !== updatedApplication.status;

    await logActivity({
      userId: req.user.id,
      applicationId: updatedApplication.id,
      action: statusChanged ? "STATUS_CHANGED" : "APPLICATION_UPDATED",
      details: statusChanged
        ? `${updatedApplication.companyName}: ${existingApplication.status} -> ${updatedApplication.status}`
        : `${updatedApplication.companyName} - ${updatedApplication.positionTitle}`,
    });

    notifyUser(req, req.user.id, {
      type: statusChanged ? "STATUS_CHANGED" : "APPLICATION_UPDATED",
      title: statusChanged ? "Application status changed" : "Application updated",
      message: statusChanged
        ? `${updatedApplication.companyName}: ${existingApplication.status} -> ${updatedApplication.status}`
        : `${updatedApplication.companyName} - ${updatedApplication.positionTitle}`,
    });

    res.status(200).json(updatedApplication);
  } catch (error) {
    console.error("Update application error:", error);
    res
      .status(500)
      .json({ message: "Server error while updating application" });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existingApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    await logActivity({
      userId: req.user.id,
      applicationId: existingApplication.id,
      action: "APPLICATION_DELETED",
      details: `${existingApplication.companyName} - ${existingApplication.positionTitle}`,
    });

    await prisma.jobApplication.delete({
      where: {
        id: req.params.id,
      },
    });

    res.status(200).json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Delete application error:", error);
    res
      .status(500)
      .json({ message: "Server error while deleting application" });
  }
};

export const getApplicationStats = async (req, res) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalApplications = applications.length;

    const statusCounts = {
      Wishlist: 0,
      Applied: 0,
      "HR Interview": 0,
      "Technical Interview": 0,
      "Test Task": 0,
      "Final Interview": 0,
      Offer: 0,
      Rejected: 0,
    };

    for (const application of applications) {
      if (statusCounts[application.status] !== undefined) {
        statusCounts[application.status] += 1;
      }
    }

    const now = new Date();

    const upcomingNextSteps = applications
      .filter((app) => app.nextStepDate && new Date(app.nextStepDate) >= now)
      .sort((a, b) => new Date(a.nextStepDate) - new Date(b.nextStepDate))
      .slice(0, 5);

    const recentApplications = applications.slice(0, 5);

    res.status(200).json({
      totalApplications,
      statusCounts,
      upcomingNextSteps,
      recentApplications,
    });
  } catch (error) {
    console.error("Get application stats error:", error);
    res.status(500).json({ message: "Server error while fetching stats" });
  }
};


export const exportApplicationsCsv = async (req, res) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=hiretrack-applications.csv");
    res.send(applicationsToCsv(applications));
  } catch (error) {
    console.error("Export CSV error:", error);
    res.status(500).json({ message: "Server error while exporting CSV" });
  }
};

export const exportApplicationsPdf = async (req, res) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=hiretrack-applications.pdf");

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(20).text("HireTrack Applications Report");
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    applications.forEach((app, index) => {
      doc.fontSize(13).text(`${index + 1}. ${app.companyName} — ${app.positionTitle}`, { underline: true });
      doc.fontSize(10).text(`Status: ${app.status} | Priority: ${app.priority}`);
      if (app.location) doc.text(`Location: ${app.location}`);
      if (app.salaryMin || app.salaryMax) doc.text(`Salary: ${app.salaryMin || "?"} - ${app.salaryMax || "?"}`);
      if (app.jobLink) doc.text(`Link: ${app.jobLink}`);
      if (app.notes) doc.text(`Notes: ${app.notes}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error("Export PDF error:", error);
    res.status(500).json({ message: "Server error while exporting PDF" });
  }
};

export const emailApplication = async (req, res) => {
  try {
    const { to, type = "summary", message = "" } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    const application = await prisma.jobApplication.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const subjectMap = {
      interview: `Interview follow-up: ${application.positionTitle}`,
      rejection: `Application update: ${application.positionTitle}`,
      summary: `HireTrack application: ${application.companyName}`,
    };

    const subject = subjectMap[type] || subjectMap.summary;
    const text = `${message ? `${message}\n\n` : ""}Application summary:
Company: ${application.companyName}
Position: ${application.positionTitle}
Status: ${application.status}
Priority: ${application.priority}
Notes: ${application.notes || "-"}`;

    const info = await sendApplicationEmail({ to, subject, text, html: `<pre>${text}</pre>` });

    await logActivity({
      userId: req.user.id,
      applicationId: application.id,
      action: "EMAIL_SENT",
      details: `${type} email sent to ${to}`,
    });

    notifyUser(req, req.user.id, {
      type: "EMAIL_SENT",
      title: "Email prepared",
      message: `${subject} → ${to}`,
    });

    res.json({ message: "Email sent or generated successfully", preview: info.message });
  } catch (error) {
    console.error("Email application error:", error);
    res.status(500).json({ message: "Server error while sending email" });
  }
};
