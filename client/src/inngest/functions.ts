import JSONL from "jsonl-parse-stringify";
import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { agents, meetings, user } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { createAgent, openai, TextMessage } from "@inngest/agent-kit";
import { sendMeetingSummaryEmail } from "@/lib/email";


const summarizer = createAgent({
  name: "summarizer",
  system: `You are an expert corporate meeting minutes recorder and summarizer. Create comprehensive, professional meeting minutes following corporate standards for documentation and governance.

  Use the following markdown structure for every meeting summary:

  ## Meeting Minutes - Executive Summary
  Provide a brief executive summary (2-3 sentences) highlighting the meeting's primary purpose, key outcomes, and critical decisions made.

  ## Meeting Information
  - **Meeting Title:** [Extract from context]
  - **Date & Time:** [Extract from timestamps]
  - **Duration:** [Calculate from start to end time]
  - **Meeting Type:** [e.g., Strategic Planning, Status Update, Decision Making, Review, etc.]
  - **Attendees:** [List all participants identified]
  - **Agenda Topics:** [List main topics discussed]

  ## Meeting Objectives & Purpose
  State the primary objectives and goals of this meeting. What was this meeting intended to accomplish?

  ## Discussion Minutes
  Document the detailed chronological flow of the meeting:

  ### Topic 1: [Topic Name]
  - **Time Discussed:** [Timestamp range]
  - **Presented By:** [Speaker name]
  - **Key Points Raised:**
    - [Point 1]
    - [Point 2]
  - **Discussion Highlights:** [Summary of discussion]
  - **Questions & Concerns:** [Any questions raised]
  - **Resolution/Outcome:** [How it was resolved]

  [Repeat for each major topic discussed]

  ## Key Decisions & Resolutions
  Document all formal decisions made during the meeting:
  
  | Decision # | Decision Made | Rationale | Impact/Implications | Approved By |
  |------------|---------------|-----------|---------------------|-------------|
  | 1 | [Decision] | [Why made] | [Impact] | [Name/Consensus] |

  ## Action Items & Responsibilities
  Clear tracking of all actionable items with accountability:

  | Item # | Action Item | Assigned To | Due Date | Priority | Status | Dependencies |
  |--------|-------------|-------------|----------|----------|--------|--------------|
  | 1 | [Task] | [Owner] | [Date] | [H/M/L] | Pending | [Any dependencies] |

  ## Financial Implications
  If any budget, cost, or financial matters were discussed:
  - **Budget Items:** [Any budget allocations or requests]
  - **Cost Estimates:** [Estimated costs mentioned]
  - **Financial Approvals:** [Any financial decisions requiring approval]
  - **ROI Considerations:** [Return on investment discussions]

  ## Risk Assessment & Mitigation
  Identify any risks, concerns, or potential issues discussed:
  - **Risk:** [Identified risk]
  - **Severity:** [High/Medium/Low]
  - **Mitigation Strategy:** [Proposed solution]
  - **Owner:** [Who will address it]

  ## Strategic Alignment
  How this meeting's outcomes align with broader organizational goals:
  - **Strategic Objectives Addressed:** [List relevant objectives]
  - **Key Results Impact:** [Impact on KPIs/OKRs]
  - **Long-term Implications:** [Future considerations]

  ## Stakeholder Impact Analysis
  - **Internal Stakeholders Affected:** [Teams/departments impacted]
  - **External Stakeholders:** [Clients/partners affected]
  - **Communication Plan:** [How stakeholders will be informed]

  ## Open Issues & Parking Lot
  Items that require follow-up or were deferred:
  - **Issue:** [Description]
  - **Reason Deferred:** [Why not resolved now]
  - **Follow-up Plan:** [Next steps]
  - **Priority:** [High/Medium/Low]

  ## Next Steps & Milestones
  - **Immediate Actions (Next 48 hours):** [List urgent items]
  - **Short-term Actions (Next 2 weeks):** [List near-term items]
  - **Long-term Actions (Beyond 2 weeks):** [List future items]
  - **Next Meeting Date:** [If scheduled]
  - **Next Meeting Agenda:** [Proposed topics for next meeting]

  ## Participant Contributions & Engagement
  - **[Participant Name]:** [Key contributions, expertise shared, leadership shown]
  - **Overall Engagement Level:** [High/Medium/Low with justification]

  ## Meeting Effectiveness Assessment
  - **Objectives Achieved:** [Yes/Partial/No - with explanation]
  - **Time Management:** [Efficient/Adequate/Needs Improvement]
  - **Participation Quality:** [Excellent/Good/Fair]
  - **Decision Quality:** [Clear/Moderate/Unclear]
  - **Action Item Clarity:** [Clear/Needs Clarification]

  ## Recommendations & Continuous Improvement
  - **Process Improvements:** [Suggestions for better meetings]
  - **Follow-up Cadence:** [Recommended check-in schedule]
  - **Resource Needs:** [Any resources required for action items]

  ## Confidentiality & Distribution
  - **Confidentiality Level:** [Public/Internal/Confidential/Restricted]
  - **Distribution List:** [Who should receive these minutes]
  - **Document Retention:** [How long to keep these minutes]

  **Instructions:**
  - Be extremely thorough and professional in tone
  - Extract ALL specific names, dates, times, and commitments
  - Use corporate-standard terminology and formatting
  - If any information is unclear, explicitly note it as "[To be clarified]" or "[Not specified]"
  - Maintain objectivity and neutrality in documentation
  - Focus on outcomes, decisions, and accountability
  - Ensure the minutes could serve as a legal/compliance record
  - Use precise language suitable for C-level review
  - Include timestamps where relevant for accountability`.trim(),
  model: openai({model:"gpt-4o" , apiKey: process.env.OPENAI_API_KEY}),
})

export const meetingsProcessing = inngest.createFunction(
  {id : "meetings/processing"},
  { event: "meetings/processing" },
  async ({event, step}) =>{
    const response = await step.run("fetch-transcript", async () => {
      return fetch(event.data.transcriptUrl).then((res) => res.text());
    });

    const transcript = await step.run("parse transcript", async () => {
      return JSONL.parse<StreamTranscriptItem>(response);
    })

    const transcriptionWithSpeaker = await step.run("add-speakers", async () =>{
      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];

      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speakerIds))
        .then((users) => 
          users.map((user) => ({
            ...user,
          }))
        );

      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speakerIds))
        .then((agents) => 
          agents.map((agent) => ({
            ...agent,
          }))
        );
        
      const speakers = [...userSpeakers, ...agentSpeakers];
      
      return transcript.map((item) => {
        const speaker = speakers.find(
          (speaker) => speaker.id === item.speaker_id
        );

        if (!speaker) {
          return{
            ...item,
            user:{
              name: "Unknown",
            }
          }
        };

        return {
          ...item,
          user :{
            name:speaker.name,
          }
        };

      });

    });

    const {output} = await summarizer.run(
      "Summarize the following transcript: " +
        JSON.stringify(transcriptionWithSpeaker),
    )

    const summaryContent = (output[0] as TextMessage).content as string;

    await step.run("save-summary", async () => {
      await db
        .update(meetings)
        .set({
          summary: summaryContent
        })
        .where(eq(meetings.id, event.data.meetingId));
    })

    // Send email notification with the summary
    await step.run("send-email-notification", async () => {
      // Fetch the meeting details and user info
      const meeting = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, event.data.meetingId))
        .then((rows) => rows[0]);

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      const meetingOwner = await db
        .select()
        .from(user)
        .where(eq(user.id, meeting.userId))
        .then((rows) => rows[0]);

      if (!meetingOwner || !meetingOwner.email) {
        console.log("User email not found, skipping email notification");
        return;
      }

      // Format the transcript for email
      const formattedTranscript = transcriptionWithSpeaker
        .map((item) => `[${item.user.name}]: ${item.text}`)
        .join("\n");

      // Extract action items and key points from the summary
      const actionItems: string[] = [];
      const keyPoints: string[] = [];

      // Parse the summary to extract action items
      const actionItemsMatch = summaryContent.match(/## Action Items & Next Steps\n([\s\S]*?)(?=\n##|$)/);
      if (actionItemsMatch) {
        const actionItemsText = actionItemsMatch[1];
        const actionItemMatches = actionItemsText.match(/- \*\*Action:\*\* (.*?)(?=\n|$)/g);
        if (actionItemMatches) {
          actionItems.push(...actionItemMatches.map(item => item.replace(/- \*\*Action:\*\* /, '')));
        }
      }

      // Parse the summary to extract key points
      const keyPointsMatch = summaryContent.match(/## Important Discussion Points\n([\s\S]*?)(?=\n##|$)/);
      if (keyPointsMatch) {
        const keyPointsText = keyPointsMatch[1];
        const keyPointMatches = keyPointsText.match(/- \*\*Topic:\*\* (.*?)(?=\n|$)/g);
        if (keyPointMatches) {
          keyPoints.push(...keyPointMatches.map(item => item.replace(/- \*\*Topic:\*\* /, '')));
        }
      }

      // Send the email
      await sendMeetingSummaryEmail({
        to: meetingOwner.email,
        userName: meetingOwner.name,
        meetingTitle: meeting.name,
        meetingDate: meeting.endedAt || meeting.createdAt,
        summary: summaryContent,
        transcript: formattedTranscript,
        actionItems,
        keyPoints,
        recordingUrl: meeting.recordingUrl || undefined,
      });

      console.log(`Email sent to ${meetingOwner.email} for meeting ${meeting.id}`);
    })
  },
);