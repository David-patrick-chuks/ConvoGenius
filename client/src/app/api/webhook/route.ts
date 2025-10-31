import OpenAi from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { streamVideo } from "@/lib/stream-video"
import {
    MessageNewEvent,
    CallEndedEvent,
    CallTranscriptionReadyEvent,
    CallSessionParticipantLeftEvent,
    CallRecordingReadyEvent,
    CallSessionStartedEvent,
} from "@stream-io/node-sdk"
import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server"
import { streamChat } from "@/lib/stream-chat";
import { generateAvatarUri } from "@/lib/avatar";
import { youSearch, youExpressAgent, youContents } from "@/lib/you-search";

const openaiClient = new OpenAi({apiKey: process.env.OPENAI_API_KEY!});

function verifySignatureWithSDK(body: string, signature: string): boolean{
    return streamVideo.verifyWebhook(body, signature)
};

export async function POST(req: NextRequest) {
    const signature = req.headers.get("x-signature");
    const apiKey = req.headers.get("x-api-key");

    if(!signature || !apiKey){
        return NextResponse.json(
            { error: "Missing signature or API key" },
            { status: 400 }
        );
    }

    const body = await req.text();

    if(!verifySignatureWithSDK(body, signature)) {
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 401 }
        );
    }

    let payload: unknown;
    try {
        payload = JSON.parse(body) as Record<string, unknown>;
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON payload" },
            { status: 400 }
        );
    }

    const eventType = (payload as Record<string, unknown>)?.type;

    if(eventType === "call.session_started") {
        const event = payload as CallSessionStartedEvent;
        const meetingId = event.call.custom?.meetingId;

        if(!meetingId){
            return NextResponse.json({error: "Missing meetingId"}, {status: 400});
        }

        const [existingMeeting] = await db
            .select()
            .from(meetings)
            .where(
                and(
                    eq(meetings.id, meetingId),
                    not(eq(meetings.status, "completed")),
                    not(eq(meetings.status, "active")),
                    not(eq(meetings.status, "cancelled")),
                    not(eq(meetings.status, "processing"))
                )
            );
        if(!existingMeeting) {
            return NextResponse.json(
                { error: "Meeting not found or already completed" },
                { status: 404 }
            );
        };

        await db
            .update(meetings)
            .set({
                status: "active",
                startedAt: new Date(),
            })
            .where(eq(meetings.id, existingMeeting.id)); 


        const [existingAgent] = await db
            .select()
            .from(agents)
            .where(eq(agents.id, existingMeeting.agentId));
        
        if(!existingAgent) {
            return NextResponse.json(
                { error: "Agent not found" },
                { status: 404 }
            );
        }
        const call = streamVideo.video.call("default", meetingId);
        const realtimeClient = await streamVideo.video.connectOpenAi({
            call,
            openAiApiKey: process.env.OPENAI_API_KEY!,
            agentUserId: existingAgent.id,
        });

        realtimeClient.updateSession({
            instructions: existingAgent.instructions, 
        });
    }else if(eventType === "call.session_participant_left") {
        const event = payload as CallSessionParticipantLeftEvent;
        const meetingId = event.call_cid.split(":")[1];

        if(!meetingId) {
            return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
        }
        const call = streamVideo.video.call("default", meetingId);
        await call.end();
    } else if(eventType === "call.session_ended") {
        const event = payload as CallEndedEvent;
        const meetingId = event.call.custom?.meetingId;

        if (!meetingId) {
            return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
        }

        await db 
            .update(meetings)
            .set({
                status:"processing",
                endedAt: new Date(),
            })
            .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));
    }else if(eventType === "call.transcription_ready") {
        const event = payload as CallTranscriptionReadyEvent;
        const meetingId = event.call_cid.split(":")[1];

        const [updatedMeeting] = await db
            .update(meetings)
            .set({
                transcriptUrl: event.call_transcription.url,
            })
            .where(eq(meetings.id, meetingId))
            .returning();
        if(!updatedMeeting) {
            return NextResponse.json(
                { error: "Meeting not found" },
                { status: 404 }
            );
        }
        await inngest.send({
            name: "meetings/processing",
            data: {
                meetingId: updatedMeeting.id,
                transcriptUrl: updatedMeeting.transcriptUrl,
            }
        })
        
    }else if(eventType === "call.recording_ready") {
        const event = payload as CallRecordingReadyEvent;
        const meetingId = event.call_cid.split(":")[1];

        await db
            .update(meetings)
            .set({
                recordingUrl: event.call_recording.url,
                status: "completed",
            })
            .where(eq(meetings.id, meetingId));
    }else if(eventType === "message.new") {
        const event = payload as MessageNewEvent;
        
        const userId = event.user?.id;
        const channelId = event.channel_id;
        const text = event.message?.text;

        if (!userId || !channelId || !text) {
            return NextResponse.json(
                { error: "Missing userId, channelId or text" },
                { status: 400 }
            );
        }

        const [existingMeeting] = await db
            .select()
            .from(meetings)
            .where(and(eq(meetings.id, channelId), eq(meetings.status, "completed")));

        if(!existingMeeting) {
            return NextResponse.json(
                { error: "Meeting not found or not completed" },
                { status: 404 }
            );
        }

        const [existingAgent] = await db
            .select()
            .from(agents)
            .where(eq(agents.id, existingMeeting.agentId));

        if(!existingAgent) {
            return NextResponse.json(
                { error: "Agent not found" },
                { status: 404 }
            );
        }

        if(userId !== existingAgent.id) {
            const instructions = `
            You are an AI assistant helping the user revisit and analyze a recently completed meeting. Your goal is to be proactive, insightful, and actionable.

            ## Meeting Summary:
            ${existingMeeting.summary}

            ## Your Original Meeting Role:
            ${existingAgent.instructions}

            ## Your Enhanced Post-Meeting Capabilities:

            **1. PROACTIVE ANALYSIS:**
            - Identify key decisions made during the meeting
            - Highlight important action items and commitments
            - Point out unresolved issues that need follow-up
            - Suggest next steps based on the discussion

            **2. INSIGHTFUL RESPONSES:**
            - Provide context and background when answering questions
            - Connect related topics discussed in the meeting
            - Offer alternative perspectives or considerations
            - Help clarify complex discussions or decisions

            **3. ACTIONABLE SUGGESTIONS:**
            - Recommend specific follow-up actions
            - Suggest deadlines or timeframes for action items
            - Identify stakeholders who should be involved
            - Propose meeting follow-ups or check-ins if needed

            **4. CONVERSATION FLOW:**
            - Ask clarifying questions to better understand user needs
            - Offer to elaborate on specific topics from the meeting
            - Suggest related topics the user might want to discuss
            - Maintain context from previous messages in this chat

            ## Guidelines:
            - Be proactive: Don't just answer questions, offer insights and suggestions
            - Be specific: Reference exact details from the meeting summary
            - Be actionable: Always try to provide next steps or recommendations
            - Be conversational: Maintain a helpful, professional but friendly tone
            - Be concise but comprehensive: Provide thorough answers without being verbose

            ## When you don't have enough information:
            Instead of just saying "I don't have that information," try to:
            - Suggest what information might be helpful to gather
            - Recommend who to ask or where to look for answers
            - Offer related insights you can provide from the meeting

            The user may ask about meeting content, next steps, action items, or need help planning follow-ups. Use the conversation history to maintain context and provide increasingly helpful responses.
            `;
        const channel = streamChat.channel("messaging", channelId);
        await channel.watch();

        const previousMessages = channel.state.messages
            .slice(-5)
            .filter((msg)  => msg.text && msg.text.trim() !== "")
            .map<ChatCompletionMessageParam>((message : any) => ({
                role: message.user?.id === existingAgent.id ? "assistant" : "user",
                content: message.text || "",
            }))

        // New: RAG integration with You.com (original three search endpoints + two new: Express Agent and Contents)
        let ragContext = '';
        let sources = '';
        try {
          // Endpoint 1: Basic search for snippets/metadata
          const basicResults = await youSearch(text);
          const basicSnippets = basicResults.results.web.map(h => `${h.title}: ${h.description} - ${h.snippets.join(' ')}`).join('\n');
          const basicUrls = basicResults.results.web.map(h => h.url).join(', ');

          // Endpoint 2: Web crawl for full content (conditional: if query needs depth, e.g., explanations or how-to)
          let webContent = '';
          let webUrls = '';
          if (text.toLowerCase().includes('how to') || text.toLowerCase().includes('explain') || text.toLowerCase().includes('details')) {
            const webResults = await youSearch(text, { livecrawl: 'web' });
            webContent = webResults.results.web.map(h => h.html || h.markdown || h.snippets.join(' ')).join('\n');  // Use full content if available
            webUrls = webResults.results.web.map(h => h.url).join(', ');
          }

          // Endpoint 3: News crawl for timely updates (conditional: if query mentions "latest" or "news")
          let newsContent = '';
          let newsUrls = '';
          if (text.toLowerCase().includes('latest') || text.toLowerCase().includes('news') || text.toLowerCase().includes('update')) {
            const newsResults = await youSearch(text, { livecrawl: 'news' });
            newsContent = newsResults.results.news.map(h => h.html || h.markdown || h.description).join('\n');
            newsUrls = newsResults.results.news.map(h => h.url).join(', ');
          }

          // New Endpoint 4: Express Agent for quick grounded answer
          const expressRes = await youExpressAgent(text);
          const expressAnswer = expressRes.output.find(o => o.type.includes('chat_node.answer'))?.text || '';

          // New Endpoint 5: Contents for full page content (use top URL from basic search if available)
          let contentsContent = '';
          let contentsUrl = '';
          if (basicResults.results.web.length > 0) {
            contentsUrl = basicResults.results.web[0].url;
            const contentsRes = await youContents([contentsUrl], 'markdown');
            contentsContent = contentsRes[0]?.markdown || contentsRes[0]?.html || '';
          }

          ragContext = `External knowledge:\nBasic info: ${basicSnippets}\nWeb details: ${webContent}\nNews updates: ${newsContent}\nExpress Agent answer: ${expressAnswer}\nFull contents from ${contentsUrl}: ${contentsContent}`;
          sources = `\n\nSources:\n- Basic: ${basicUrls}\n- Web: ${webUrls}\n- News: ${newsUrls}\n- Express Agent: (internal)\n- Contents: ${contentsUrl}`;
        } catch (error) {
          console.error('You.com RAG error:', error);  // Fallback to no RAG if fails
        }

        const GPTResponse = await openaiClient.chat.completions.create({
            messages: [
                {role: "system", content: instructions},
                ...previousMessages,
                {role: "user", content: `${text}\n\n${ragContext}`}
            ],
            model: "gpt-4o",
        })

        const GPTResponseText = GPTResponse.choices[0].message.content;

        if(!GPTResponseText) {
            return NextResponse.json(
                { error: "No response from GPT" },
                { status: 400 }
            );
        }

        // Append sources to the response for transparency
        const finalResponseText = `${GPTResponseText}${sources}`;

        const avatarUrl = generateAvatarUri({
            seed: existingAgent.name,
            variant: "botttsNeutral",
        })

        streamChat.upsertUser({
            id: existingAgent.id,
            name: existingAgent.name,
            image: avatarUrl, 
        })

        channel.sendMessage({
            text: finalResponseText,
            user:{
                id: existingAgent.id,
                name: existingAgent.name,
                image: avatarUrl, 
            }
        })

        
    }
}


    return NextResponse.json({ status: "ok" })

}