"use server";

import nodemailer from "nodemailer";

// Create transporter outside of the function to reuse it
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendEmailAlert({
  from = "crypticmeta@coderixx.com", // Default 'from' address
  to = "ankitpathak@coderixx.com", // Default 'to' address
  subject,
  html,
}: {
  from?: string;
  to?: string;
  subject: string;
  html: string;
}) {
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    // Optionally, throw the error or handle it as needed
  }
}
