import prisma from "../config/prisma.js";
import { notifyUser } from "./notify.js";
import { sendApplicationEmail } from "./mailer.js";
import { sendTelegramMessage } from "./telegram.js";

const getRecruiterUserIds = async (jobId) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { recruiterId: true },
  });

  if (!job) return [];

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const ids = new Set([job.recruiterId, ...admins.map((u) => u.id)]);
  return [...ids];
};

export const dispatchHireNotification = async (req, {
  type,
  title,
  message,
  jobId = null,
  recipientUserIds = [],
  emailSubject = null,
  emailBody = null,
}) => {
  const uniqueRecipients = [...new Set(recipientUserIds)];

  for (const userId of uniqueRecipients) {
    notifyUser(req, userId, { type, title, message });
  }

  if (emailSubject && emailBody) {
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueRecipients } },
      select: { email: true },
    });

    for (const user of users) {
      try {
        await sendApplicationEmail({
          to: user.email,
          subject: emailSubject,
          text: emailBody,
          html: `<p>${emailBody}</p>`,
        });
      } catch (error) {
        console.error("Notification email error:", error);
      }
    }
  }

  try {
    await sendTelegramMessage(`<b>${title}</b>\n${message}`);
  } catch (error) {
    console.error("Telegram notification error:", error);
  }
};

export const notifyRecruitersForJob = async (req, jobId, payload) => {
  const recipientUserIds = await getRecruiterUserIds(jobId);
  await dispatchHireNotification(req, {
    ...payload,
    jobId,
    recipientUserIds,
  });
};
