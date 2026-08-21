import { EmailClient } from "@azure/communication-email";

// Azure Communication Services (Email) — replaces SendGrid.
// Required env vars:
//   AZURE_COMMUNICATION_CONNECTION_STRING - ACS resource connection string
//   EMAIL_USER (or AZURE_COMMUNICATION_SENDER) - sender address, e.g.
//     DoNotReply@<your-mailfrom-domain>.azurecomm.net or a custom verified domain

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const senderAddress =
  process.env.AZURE_COMMUNICATION_SENDER || process.env.EMAIL_USER;

const emailClient = connectionString
  ? new EmailClient(connectionString)
  : null;

export const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!emailClient) {
      throw new Error(
        "AZURE_COMMUNICATION_CONNECTION_STRING is not configured"
      );
    }
    if (!senderAddress) {
      throw new Error(
        "Sender address missing: set AZURE_COMMUNICATION_SENDER or EMAIL_USER"
      );
    }

    console.log("Sending email to:", to);
    console.log("From:", senderAddress);

    const message = {
      senderAddress,
      content: {
        subject,
        html,
      },
      recipients: {
        to: [{ address: to }],
      },
    };

    const poller = await emailClient.beginSend(message);
    const result = await poller.pollUntilDone();

    if (result.status !== "Succeeded") {
      throw new Error(`ACS email send failed with status: ${result.status}`);
    }

    console.log("EMAIL SENT:", result.id);
    return result;
  } catch (error) {
    console.error("AZURE ACS EMAIL ERROR:", error.message || error);
    throw error;
  }
};
