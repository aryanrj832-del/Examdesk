import nodemailer from "nodemailer";

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendVerificationEmail(to: string, code: string) {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "examdesk@atria.edu";

  if (!smtpConfigured()) {
    console.info(`[Examdesk] Password reset code for ${to}: ${code}`);
    return { sent: false, devLogged: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject: "EXAM DESK – Password reset code",
    text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes.`,
    html: `<p>Your password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>This code expires in 15 minutes.</p>`,
  });

  return { sent: true, devLogged: false };
}
