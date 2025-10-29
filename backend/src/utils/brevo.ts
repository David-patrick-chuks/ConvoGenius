import { TransactionalEmailsApi, SendSmtpEmail } from "@getbrevo/brevo";

const emailAPI = new TransactionalEmailsApi();

// Set API key from environment variable
emailAPI.authentications.apiKey.apiKey = process.env.BREVO_API_KEY || "";

export async function sendMail(
  toEmail: string,
  subject: string,
  htmlContent: string,
  senderName: string = "CortexDesk",
  senderEmail: string = process.env.BREVO_SENDER_EMAIL || "no-reply@cortexdesk.com"
): Promise<any> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn("⚠️ BREVO_API_KEY not configured. Email sending skipped.");
      return { messageId: "mock-message-id", sent: false };
    }

    const message = new SendSmtpEmail();
    message.subject = subject;
    message.to = [{ email: toEmail }];
    message.sender = { name: senderName, email: senderEmail };
    message.htmlContent = htmlContent;

    const response = await emailAPI.sendTransacEmail(message);

    console.log("✅ Email sent successfully:", response?.body?.messageId || response);
    return response;
  } catch (error: any) {
    console.error("❌ Error sending email:", error?.body || error?.message || error);
    throw new Error("Email sending failed");
  }
}

export default sendMail;
