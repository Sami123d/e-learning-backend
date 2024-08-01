import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";

const app = express();

app.use(cors());
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: 587,
  auth: {
    user: process.env.BREVO_SMTP_USER, // Update your environment variable
    pass: process.env.BREVO_SMTP_PASS, // Update your environment variable
  },
});

const sendMail = async (to, subject, text) => {
  const mailOptions = {
    from: "muhammaduzair25k@gmail.com", // Replace with your verified sender email
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export default sendMail;
