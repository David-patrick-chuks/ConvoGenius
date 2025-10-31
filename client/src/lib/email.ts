import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection configuration
transporter.verify(function (error) {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

interface SendMeetingSummaryEmailParams {
  to: string;
  userName: string;
  meetingTitle: string;
  meetingDate: Date;
  summary: string;
  transcript: string;
  actionItems: string[];
  keyPoints: string[];
  recordingUrl?: string;
}

export async function sendMeetingSummaryEmail({
  to,
  userName,
  meetingTitle,
  meetingDate,
  summary,
  transcript,
  actionItems,
  keyPoints,
  recordingUrl,
}: SendMeetingSummaryEmailParams) {
  const formattedDate = meetingDate.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Convert markdown to HTML-friendly format with styling
  const formatMarkdownForEmail = (markdown: string): string => {
    let html = markdown;
    
    // First, handle tables separately
    html = html.replace(/(\|.+\|\n)+/g, (tableMatch) => {
      const rows = tableMatch.trim().split('\n').filter(row => !row.includes('---'));
      if (rows.length === 0) return '';
      
      let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">';
      
      rows.forEach((row, index) => {
        const cells = row.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
        
        if (index === 0) {
          // Header row
          tableHtml += '<thead><tr style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);">';
          cells.forEach(cell => {
            tableHtml += `<th style="padding: 14px 12px; text-align: left; color: #ffffff; font-weight: 700; font-size: 14px; border: 1px solid #3b82f6; text-transform: uppercase; letter-spacing: 0.5px;">${cell.replace(/\*\*/g, '')}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
        } else {
          // Data rows with alternating colors
          const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
          tableHtml += `<tr style="background-color: ${bgColor};">`;
          cells.forEach(cell => {
            tableHtml += `<td style="padding: 12px; color: #334155; font-size: 14px; border: 1px solid #e2e8f0; line-height: 1.6;">${cell.replace(/\*\*/g, '<strong>').replace(/\*\*/g, '</strong>')}</td>`;
          });
          tableHtml += '</tr>';
        }
      });
      
      tableHtml += '</tbody></table>';
      return tableHtml;
    });
    
    // Headers with different styles
    html = html.replace(/^## (.+)$/gm, '<div style="margin-top: 36px;"><h2 style="color: #1e3a8a; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; padding-bottom: 10px; border-bottom: 3px solid #3b82f6; display: flex; align-items: center;"><span style="background: linear-gradient(135deg, #3b82f6, #1e3a8a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">$1</span></h2></div>');
    html = html.replace(/^### (.+)$/gm, '<h3 style="color: #1e40af; font-size: 18px; font-weight: 700; margin: 24px 0 12px 0; padding-left: 12px; border-left: 4px solid #60a5fa;">$1</h3>');
    html = html.replace(/^#### (.+)$/gm, '<h4 style="color: #2563eb; font-size: 16px; font-weight: 600; margin: 20px 0 10px 0; padding-left: 8px;">$1</h4>');
    
    // Bold text with highlighting
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #1e3a8a; font-weight: 700; background-color: #dbeafe; padding: 2px 6px; border-radius: 3px;">$1</strong>');
    
    // Italic text
    html = html.replace(/\*([^*]+)\*/g, '<em style="color: #64748b; font-style: italic;">$1</em>');
    
    // Bullet lists with better styling
    html = html.replace(/^- (.+)$/gm, '<li style="color: #475569; font-size: 15px; line-height: 1.8; margin-bottom: 10px; padding-left: 8px; position: relative;">$1</li>');
    
    // Wrap consecutive list items
    html = html.replace(/(<li .+?<\/li>\n?)+/g, (match) => {
      return '<ul style="margin: 16px 0; padding-left: 28px; list-style-type: none;">' + 
        match.replace(/<li /g, '<li style="padding-left: 8px; position: relative;" ').replace(/<li style="[^"]*"/g, '$& ') +
        '</ul>';
    });
    
    // Add custom bullet points
    html = html.replace(/<li style="([^"]*)"/g, '<li style="$1" ');
    html = html.replace(/<li /g, '<li style="padding-left: 24px; position: relative; margin-bottom: 8px;" ');
    
    // Paragraphs
    html = html.replace(/^([^<\n#-|].+)$/gm, '<p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 12px 0;">$1</p>');
    
    // Clean up extra line breaks
    html = html.replace(/\n\n+/g, '<div style="margin: 16px 0;"></div>');
    html = html.replace(/\n/g, '');
    
    return html;
  };

  const formattedSummary = formatMarkdownForEmail(summary);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Minutes - ${meetingTitle}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
        <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
          
          <!-- Professional Header with Navy Blue -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 48px 32px; border-bottom: 4px solid #1e40af;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                    Meeting Minutes
                  </h1>
                  <p style="color: #bfdbfe; margin: 0; font-size: 15px; font-weight: 500;">
                    Official Record • ${formattedDate}
                  </p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Executive Summary Banner -->
          <div style="background-color: #eff6ff; border-left: 5px solid #3b82f6; padding: 24px 32px; margin: 0;">
            <p style="color: #1e3a8a; font-size: 15px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
              📋 Confidential Meeting Record
            </p>
            <h2 style="color: #1e40af; font-size: 22px; margin: 0 0 8px 0; font-weight: 700;">
              ${meetingTitle}
            </h2>
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <!-- Main Content Area -->
          <div style="padding: 40px 32px;">
            
            <!-- Personalized Greeting -->
            <p style="color: #1e293b; font-size: 16px; margin: 0 0 24px 0;">
              Dear <strong style="color: #1e3a8a;">${userName}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0;">
              Please find below the comprehensive meeting minutes and documentation for the session held on <strong>${formattedDate}</strong>. This official record includes executive summary, action items, key decisions, and complete transcript for your review and reference.
            </p>

            ${
              recordingUrl
                ? `
            <!-- Recording Access Card -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
              <div style="margin-bottom: 16px;">
                <span style="font-size: 48px;">🎥</span>
              </div>
              <h3 style="color: #065f46; font-size: 20px; margin: 0 0 12px 0; font-weight: 700;">
                Meeting Recording Available
              </h3>
              <p style="color: #047857; font-size: 14px; margin: 0 0 20px 0; line-height: 1.6;">
                Access the full video recording of this meeting for detailed review and reference.
              </p>
              <a href="${recordingUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                ▶️ Watch Recording
              </a>
              <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0 0;">
                Recording Link: <a href="${recordingUrl}" style="color: #3b82f6; text-decoration: none;">${recordingUrl.substring(0, 50)}...</a>
              </p>
            </div>
            `
                : ""
            }

            <!-- Meeting Minutes Summary -->
            <div style="background-color: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 32px; margin-bottom: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; border-left: 5px solid #1e3a8a;">
                <h3 style="color: #1e3a8a; font-size: 20px; margin: 0; font-weight: 700; display: flex; align-items: center;">
                  <span style="margin-right: 10px; font-size: 24px;">📝</span> Official Meeting Minutes
                </h3>
              </div>
              <div style="color: #334155; font-size: 15px; line-height: 1.8;">
                ${formattedSummary}
              </div>
            </div>

            ${
              keyPoints.length > 0
                ? `
            <!-- Key Discussion Points -->
            <div style="background-color: #fefce8; border-left: 5px solid #eab308; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
              <h3 style="color: #854d0e; font-size: 19px; margin: 0 0 18px 0; font-weight: 700; display: flex; align-items: center;">
                <span style="margin-right: 10px;">💡</span> Key Discussion Points
              </h3>
              <ul style="color: #713f12; font-size: 15px; line-height: 1.9; margin: 0; padding-left: 24px;">
                ${keyPoints.map((point) => `<li style="margin-bottom: 12px; padding-left: 8px;">${point}</li>`).join("")}
              </ul>
            </div>
            `
                : ""
            }

            ${
              actionItems.length > 0
                ? `
            <!-- Action Items & Deliverables -->
            <div style="background-color: #fef2f2; border-left: 5px solid #ef4444; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
              <h3 style="color: #991b1b; font-size: 19px; margin: 0 0 18px 0; font-weight: 700; display: flex; align-items: center;">
                <span style="margin-right: 10px;">✅</span> Action Items & Deliverables
              </h3>
              <div style="background-color: #ffffff; border-radius: 8px; padding: 16px;">
                <ul style="color: #7f1d1d; font-size: 15px; line-height: 1.9; margin: 0; padding-left: 24px;">
                  ${actionItems.map(
                    (item, index) => `
                    <li style="margin-bottom: 16px; padding: 12px; background-color: #fff7ed; border-radius: 6px; border-left: 3px solid #f97316;">
                      <strong style="color: #991b1b; font-size: 16px;">Action ${index + 1}:</strong>
                      <div style="color: #7c2d12; margin-top: 6px; line-height: 1.7;">${item}</div>
                    </li>
                  `
                  ).join("")}
                </ul>
              </div>
            </div>
            `
                : ""
            }

            <!-- Full Meeting Transcript -->
            <div style="margin-bottom: 32px;">
              <div style="border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px;">
                <h3 style="color: #1e3a8a; font-size: 19px; margin: 0; font-weight: 700; display: flex; align-items: center;">
                  <span style="margin-right: 10px;">📄</span> Complete Meeting Transcript
                </h3>
              </div>
              <div style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 8px; padding: 20px; max-height: 500px; overflow-y: auto;">
                <pre style="color: #475569; font-size: 14px; line-height: 1.9; margin: 0; white-space: pre-wrap; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', 'Source Code Pro', monospace;">${transcript}</pre>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0 0; font-style: italic;">
                * Transcript is automatically generated and may contain minor inaccuracies.
              </p>
            </div>

            <!-- Call-to-Action Buttons -->
            <div style="text-align: center; margin: 48px 0 40px 0;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                       style="display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 15px rgba(30, 58, 138, 0.3); text-transform: uppercase; letter-spacing: 1px;">
                      📊 View Full Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #64748b; font-size: 13px; margin: 16px 0 0 0;">
                Access all your meetings, analytics, and team insights
              </p>
            </div>

            <!-- Confidentiality Notice -->
            <div style="background-color: #f1f5f9; border-left: 4px solid #64748b; border-radius: 6px; padding: 20px; margin: 32px 0;">
              <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0; font-weight: 600;">
                ⚠️ CONFIDENTIALITY NOTICE
              </p>
              <p style="color: #64748b; font-size: 13px; line-height: 1.7; margin: 8px 0 0 0;">
                This meeting record contains confidential and proprietary information. Unauthorized disclosure, copying, distribution, or use of this information is strictly prohibited and may be unlawful. If you received this in error, please notify the sender immediately and delete all copies.
              </p>
            </div>

            <!-- Professional Closing -->
            <div style="margin: 32px 0 0 0; padding-top: 24px; border-top: 2px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 0 0 16px 0;">
                Should you have any questions or require clarification on any items discussed, please don't hesitate to reach out.
              </p>
              <p style="color: #475569; font-size: 15px; margin: 0;">
                Best regards,<br>
                <strong style="color: #1e3a8a; font-size: 16px;">The ConvoGenius Team</strong>
              </p>
              <p style="color: #94a3b8; font-size: 13px; margin: 12px 0 0 0; font-style: italic;">
                Intelligent Meeting Management Platform
              </p>
            </div>

          </div>

          <!-- Professional Footer -->
          <div style="background: linear-gradient(to right, #f8fafc 0%, #f1f5f9 100%); padding: 32px; border-top: 3px solid #e2e8f0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align: center;">
                  <p style="color: #64748b; font-size: 13px; margin: 0 0 12px 0; font-weight: 600;">
                    ConvoGenius - Enterprise Meeting Intelligence Platform
                  </p>
                  <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">
                    This is an automated message generated by the ConvoGenius system.
                  </p>
                  <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
                    © ${new Date().getFullYear()} ConvoGenius. All rights reserved. | Privacy Policy | Terms of Service
                  </p>
                  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                      🔒 Secure • 🌐 ${process.env.NEXT_PUBLIC_APP_URL} • 📧 Delivered via Gmail SMTP
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </div>

        </div>
      </body>
    </html>
  `;

  const textContent = `
═══════════════════════════════════════════════════════════
MEETING MINUTES - OFFICIAL RECORD
═══════════════════════════════════════════════════════════

Meeting: ${meetingTitle}
Date: ${formattedDate}
Generated: ${new Date().toLocaleString("en-US")}

Dear ${userName},

Please find below the comprehensive meeting minutes and documentation 
for the session held on ${formattedDate}.

${recordingUrl ? `
───────────────────────────────────────────────────────────
🎥 MEETING RECORDING AVAILABLE
───────────────────────────────────────────────────────────
Access the full video recording:
${recordingUrl}
` : ""}

───────────────────────────────────────────────────────────
📝 MEETING MINUTES & EXECUTIVE SUMMARY
───────────────────────────────────────────────────────────
${summary}

${keyPoints.length > 0 ? `
───────────────────────────────────────────────────────────
💡 KEY DISCUSSION POINTS
───────────────────────────────────────────────────────────
${keyPoints.map((point, i) => `${i + 1}. ${point}`).join("\n")}
` : ""}

${actionItems.length > 0 ? `
───────────────────────────────────────────────────────────
✅ ACTION ITEMS & DELIVERABLES
───────────────────────────────────────────────────────────
${actionItems.map((item, i) => `Action ${i + 1}: ${item}`).join("\n\n")}
` : ""}

───────────────────────────────────────────────────────────
📄 COMPLETE MEETING TRANSCRIPT
───────────────────────────────────────────────────────────
${transcript}

* Transcript is automatically generated and may contain minor inaccuracies.

───────────────────────────────────────────────────────────

View Full Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

⚠️ CONFIDENTIALITY NOTICE
This meeting record contains confidential and proprietary information.
Unauthorized disclosure, copying, distribution, or use of this 
information is strictly prohibited and may be unlawful.

Best regards,
The ConvoGenius Team
Intelligent Meeting Management Platform

═══════════════════════════════════════════════════════════
© ${new Date().getFullYear()} ConvoGenius. All rights reserved.
This is an automated message generated by the ConvoGenius system.
═══════════════════════════════════════════════════════════
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `� Official Meeting Minutes: ${meetingTitle} - ${meetingDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      text: textContent,
      html: htmlContent,
    });

    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
