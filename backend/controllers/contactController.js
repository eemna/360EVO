import { sendEmail } from "../utils/email.js";

const escapeHtml = (unsafe) => {
  if (typeof unsafe !== "string") return String(unsafe ?? "");
  return unsafe
    .replaceAll(String.fromCharCode(38), String.fromCharCode(38, 97, 109, 112, 59))
    .replaceAll(String.fromCharCode(60), String.fromCharCode(38, 108, 116, 59))
    .replaceAll(String.fromCharCode(62), String.fromCharCode(38, 103, 116, 59))
    .replaceAll(String.fromCharCode(34), String.fromCharCode(38, 113, 117, 111, 116, 59))
    .replaceAll(String.fromCharCode(39), String.fromCharCode(38, 35, 48, 51, 57, 59));
};

const buildEmailBody = (data) => {
  const rows = Object.entries(data)
    .filter(([key]) => key !== "persona")
    .map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
    })
    .join("");

  return `
    <p><strong>Type:</strong> ${escapeHtml(data.persona || "General")}</p>
    ${rows}
  `;
};

export const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, message, persona, ...rest } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "Name, email, and message are required",
      });
    }

    const emailData = { name, email, message, persona, ...rest };

    await sendEmail({
      to: "Contact-Us@360EVO.AI",
      subject: `New contact form submission from ${name}`,
      html: buildEmailBody(emailData),
    });

    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    next(error);
  }
};
