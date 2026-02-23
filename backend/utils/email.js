import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("Sending email to:", to);
    console.log("Using API KEY:", !!process.env.SENDGRID_API_KEY);
    console.log("From:", process.env.EMAIL_USER);
    const msg = {
      to,
      from: process.env.EMAIL_USER,
      subject,
      html,
    };

    const response = await sgMail.send(msg);
    console.log("EMAIL SENT:", response[0].statusCode);
  } catch (error) {
    console.error("SENDGRID ERROR:", error.response?.body || error);
    throw error;
  }
};
