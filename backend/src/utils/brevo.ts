import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from "@getbrevo/brevo";

// ✅ Create instance of Brevo transactional email API
const transactionalEmailsApi = new TransactionalEmailsApi();

// ✅ Set API key securely from environment variable
transactionalEmailsApi.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ""
);

/**
 * Send a transactional email using Brevo
 * @param toEmail - Recipient email
 * @param subject - Email subject
 * @param htmlContent - HTML version of the email
 * @param textContent - Optional text version
 * @param senderName - Sender name (default: "CortexDesk")
 * @param senderEmail - Sender email (default: process.env.BREVO_SENDER_EMAIL or fallback)
 */
export async function sendMail(
  toEmail: string,
  subject: string,
  htmlContent: string,
  textContent?: string,
  senderName = "CortexDesk",
  senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@cortexdesk.com"
): Promise<void> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn("⚠️ BREVO_API_KEY not configured. Skipping email send.");
      return;
    }

    const result = await transactionalEmailsApi.sendTransacEmail({
      to: [{ email: toEmail, name: toEmail.split("@")[0] }],
      subject,
      htmlContent,
      textContent,
      sender: { email: senderEmail, name: senderName },
    });

    console.log("✅ Email sent successfully! Message ID:", result.body?.messageId);
  } catch (error: any) {
    console.error("❌ Failed to send email:", error?.body || error?.message || error);
    throw new Error("Email sending failed");
  }
}
