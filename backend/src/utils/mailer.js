import nodemailer from "nodemailer";

const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = nodemailer.createTransport(
  hasSmtpConfig
    ? {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }
    : {
        jsonTransport: true,
      },
);

export const sendApplicationEmail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || "HireTrack <no-reply@hiretrack.local>",
    to,
    subject,
    text,
    html,
  });
};
