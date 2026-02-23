import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false, 
  auth: {
    user: "apikey", 
    pass: process.env.SENDGRID_API_KEY, 
  },
  tls: {
    rejectUnauthorized: false, 
  },
});

transporter.verify((error) => {
  if (error) {
    console.log("SMTP ERROR:", error);
  } else {
    console.log("SMTP READY");
  }
});

export const sendEmail = async (options) => {
  try {
    const info = await transporter.sendMail(options);
    console.log("EMAIL SENT:", info.response);
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
};