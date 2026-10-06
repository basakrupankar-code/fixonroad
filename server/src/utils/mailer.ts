import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('\n[WARNING]: SMTP_USER or SMTP_PASS is missing in .env. Falling back to console logging.');
    console.log(`\n--- MOCK EMAIL TO: ${to} ---\nSubject: ${subject}\n\n${html}\n---------------------------\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"FixOnRoad" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};
